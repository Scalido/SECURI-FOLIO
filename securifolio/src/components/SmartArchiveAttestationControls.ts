import React from 'react'
import { Loader2, Lock } from 'lucide-react'

import {
  buildSmartArchiveAttestation,
  canSubmitArchive,
} from '@/lib/validations'
import type { AgentProfileState } from '@/lib/validations'

type SmartArchiveAttestationControlsProps = {
  profileState: AgentProfileState
  isCertified: boolean
  isSaving: boolean
  onCertifiedChange: (isCertified: boolean) => void
  onCancel: () => void
  onSubmit: () => void
}

export function SmartArchiveAttestationControls({
  profileState,
  isCertified,
  isSaving,
  onCertifiedChange,
  onCancel,
  onSubmit,
}: SmartArchiveAttestationControlsProps) {
  const profileReady = profileState.status === 'ready'
  const identityContent = profileState.status === 'ready'
    ? buildSmartArchiveAttestation(profileState.profile)
    : profileState.status === 'error'
      ? React.createElement('span', { role: 'alert', className: 'text-red-500' }, profileState.error)
      : 'Chargement de l’identité de l’agent connecté…'

  return React.createElement(
    'div',
    { className: 'p-6 border-t border-slate-200 dark:border-brand-border bg-brand-bg/30 space-y-4' },
    React.createElement(
      'div',
      { className: 'flex items-start gap-2 text-[10px] text-slate-500 font-medium' },
      React.createElement('input', {
        type: 'checkbox',
        id: 'certify',
        checked: isCertified,
        disabled: !profileReady,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          if (profileReady) onCertifiedChange(event.target.checked)
        },
        className: 'mt-0.5 accent-brand-primary disabled:cursor-not-allowed',
      }),
      React.createElement('label', { htmlFor: 'certify' }, identityContent),
    ),
    React.createElement(
      'div',
      { className: 'flex gap-4' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onCancel,
          className: 'flex-1 py-3.5 border border-slate-200 dark:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-surface rounded-xl text-xs font-bold uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300',
        },
        'Annuler',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          disabled: !canSubmitArchive(isCertified, isSaving, profileReady),
          onClick: onSubmit,
          className: 'flex-[2] bg-brand-primary hover:bg-emerald-400 disabled:bg-brand-primary/50 disabled:cursor-not-allowed text-brand-bg py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none transition-all flex justify-center items-center gap-2',
        },
        isSaving
          ? React.createElement(Loader2, { size: 14, className: 'animate-spin' })
          : React.createElement(Lock, { size: 14 }),
        isSaving ? 'Enregistrement...' : 'Transmettre pour Validation',
      ),
    ),
  )
}
