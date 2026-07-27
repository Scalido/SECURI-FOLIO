'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Database,
  FileSearch,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react'

import type {
  AntiFolioOutcome,
  SearchState,
} from '@/lib/anti-folio/types'
import { deriveAntiFolioOutcome } from '@/lib/anti-folio/verdict'
import {
  checkCadastralNumber,
  getScanHistory,
  saveScanHistory,
} from './actions'

interface HistoryItem {
  id: string
  numero_cadastral: string
  resultat: string
}

const outcomeLabels: Record<SearchState, string> = {
  match: 'Correspondance trouvée',
  not_found: 'Titre introuvable dans Securifolio',
  ambiguous: 'Plusieurs correspondances — vérification requise',
  technical_error: 'Vérification indisponible — aucune conclusion possible',
}

const outcomeStyles: Record<SearchState, string> = {
  match: 'border-brand-primary/40 bg-brand-primary/5 text-brand-primary',
  not_found: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  ambiguous: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  technical_error: 'border-slate-400/40 bg-slate-500/5 text-slate-600 dark:text-slate-300',
}

export default function AntiFolioPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [outcome, setOutcome] = useState<AntiFolioOutcome | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const refreshHistory = async () => {
    const data = await getScanHistory()
    setHistory((data ?? []) as HistoryItem[])
  }

  useEffect(() => {
    void refreshHistory()
  }, [])

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    const cadastralNumber = query.trim()
    if (!cadastralNumber) return

    setIsLoading(true)
    setOutcome(null)
    setErrorMessage(null)

    try {
      const response = await checkCadastralNumber(cadastralNumber)
      const nextOutcome = response.ok
        ? deriveAntiFolioOutcome({ records: response.records })
        : deriveAntiFolioOutcome({ searchError: true })

      setOutcome(nextOutcome)

      if (!response.ok) {
        setErrorMessage(response.message)
        if (response.code === 'DATABASE_ERROR') {
          await saveScanHistory(cadastralNumber, nextOutcome.searchState)
        }
      } else {
        await saveScanHistory(cadastralNumber, nextOutcome.searchState)
      }

      await refreshHistory()
    } catch {
      setOutcome(deriveAntiFolioOutcome({ searchError: true }))
      setErrorMessage('Une erreur technique inattendue a interrompu la vérification.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-full flex-1 bg-brand-bg text-slate-900 dark:text-white">
      <main className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-16">
        <header className="mb-12 max-w-2xl space-y-4 text-center">
          <div className="mx-auto inline-flex rounded-2xl border border-slate-200 bg-white p-3 text-brand-primary shadow-lg dark:border-brand-border dark:bg-brand-surface">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl">
            Vérification <span className="text-brand-primary">Anti-Folio</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 md:text-base">
            Interrogez le registre Securifolio par numéro cadastral ou référence
            volume/folio. Le résultat décrit uniquement les correspondances
            disponibles et leur statut administratif enregistré.
          </p>
        </header>

        <section className="w-full max-w-2xl space-y-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-2.5 shadow-xl transition focus-within:border-brand-primary/50 dark:border-brand-border dark:bg-brand-surface/60 sm:flex-row"
          >
            <Search className="ml-3 hidden h-5 w-5 text-brand-primary sm:block" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Vol AMA 171 Folio 68 ou numéro cadastral"
              className="w-full flex-1 bg-transparent px-4 py-3.5 text-sm font-semibold outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-bg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              {isLoading ? 'Recherche…' : 'Vérifier'}
            </button>
          </form>

          <div className="flex items-start gap-2 px-3 text-[11px] leading-relaxed text-slate-500">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Une absence de correspondance, une panne ou plusieurs résultats ne
            prouvent ni fraude ni authenticité. Une vérification humaine reste
            requise lorsque le résultat n’est pas univoque.
          </div>

          {history.length > 0 && (
            <div className="border-t border-slate-200/60 px-3 pt-4 dark:border-brand-border">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Clock className="h-3 w-3" />
                Dernières recherches
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQuery(item.numero_cadastral)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[10px] font-bold text-slate-600 transition hover:border-brand-primary/40 dark:border-brand-border dark:bg-brand-surface dark:text-slate-300"
                  >
                    {item.numero_cadastral}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {outcome && (
          <section className="mt-12 w-full max-w-3xl space-y-5">
            <div className={`rounded-3xl border p-7 ${outcomeStyles[outcome.searchState]}`}>
              <div className="flex items-center gap-3">
                <Database className="h-7 w-7 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-75">
                    Constat technique
                  </p>
                  <h2 className="text-xl font-black tracking-tight">
                    {outcomeLabels[outcome.searchState]}
                  </h2>
                </div>
              </div>
              {outcome.searchState === 'match' && (
                <p className="mt-4 text-sm font-semibold">
                  Correspondance trouvée dans le registre Securifolio
                </p>
              )}
              {errorMessage && (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-brand-border dark:bg-brand-surface/70">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Statut administratif enregistré
              </p>
              <p className="mt-2 text-base font-bold">
                {outcome.administrativeStatus ?? 'Non déterminé par cette recherche'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Ce statut administratif est affiché séparément du constat de
                correspondance technique.
              </p>
            </div>

            {outcome.records.length > 0 && (
              <div className="space-y-3">
                {outcome.records.map((title) => (
                  <article
                    key={title.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-brand-border dark:bg-brand-surface/70 sm:grid-cols-2"
                  >
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Propriétaire enregistré
                      </p>
                      <p className="mt-1 font-bold">{title.nom_proprietaire}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Statut administratif
                      </p>
                      <p className="mt-1 font-bold">{title.statut}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Référence
                      </p>
                      <p className="mt-1 font-mono">
                        {title.volume} / {title.folio}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Circonscription
                      </p>
                      <p className="mt-1">{title.circonscription}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
