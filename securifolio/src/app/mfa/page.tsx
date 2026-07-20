'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Smartphone, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type MfaStep = 'loading' | 'enroll' | 'verify' | 'complete';

type TotpFactor = {
  id: string;
  friendly_name?: string;
  status?: string;
};

const redirectByRole: Record<string, string> = {
  chef_cadastre: '/cadastre-dashboard',
  conservateur: '/conservateur-dashboard',
};

export default function MfaPage() {
  const router = useRouter();
  const [step, setStep] = useState<MfaStep>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const redirectAfterMfa = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    router.push(profile?.role ? redirectByRole[profile.role] || '/smart-archive' : '/smart-archive');
  };

  useEffect(() => {
    const initMfa = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.data?.currentLevel === 'aal2') {
        setStep('complete');
        await redirectAfterMfa();
        return;
      }

      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setError(error.message);
        setStep('verify');
        return;
      }

      const verifiedTotp = data?.totp?.find((factor: TotpFactor) => factor.status === 'verified');
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setStep('verify');
        return;
      }

      setStep('enroll');
    };

    initMfa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEnrollment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Nettoyer les anciens facteurs non-vérifiés pour éviter l'erreur "already exists"
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp) {
        const unverifiedFactors = factors.totp.filter((f: TotpFactor) => f.status === 'unverified');
        for (const factor of unverifiedFactors) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
    } catch (e) {
      console.error('Erreur lors du nettoyage des facteurs', e);
    }

    const { data, error } = await supabase.auth.mfa.enroll({ 
      factorType: 'totp',
      friendlyName: `Securifolio MFA - ${Math.floor(Math.random() * 10000)}`
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep('verify');
    setLoading(false);
  };

  const verifyCode = async () => {
    if (!factorId || code.trim().length !== 6) {
      setError('Saisissez le code à 6 chiffres généré par votre application MFA.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    setStep('complete');
    setLoading(false);
    await redirectAfterMfa();
  };

  return (
    <div className="w-full flex-1 bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[420px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-brand-surface/80 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 text-brand-primary mb-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Vérification <span className="text-brand-primary">MFA</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Les rôles sensibles doivent confirmer un second facteur avant d&apos;accéder aux opérations foncières critiques.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            <p className="text-xs font-bold uppercase tracking-widest">Vérification du niveau de session...</p>
          </div>
        )}

        {step === 'enroll' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="font-bold text-slate-900 dark:text-white mb-2">Aucun facteur MFA vérifié n&apos;est associé à ce compte.</p>
              <p>Scannez un QR code avec Google Authenticator, Authy, 1Password ou une application TOTP équivalente.</p>
            </div>
            <button
              type="button"
              onClick={startEnrollment}
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-emerald-400 text-brand-bg font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Générer le facteur MFA
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            {qrCode && (
              <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200">
                {/* SVG injecté directement pour éviter les problèmes d'encodage d'URI de données (data:) sur les navigateurs modernes */}
                <div 
                  dangerouslySetInnerHTML={{ __html: qrCode }} 
                  className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                />
                {secret && <p className="text-[11px] text-slate-600 font-mono break-all text-center">Secret manuel : {secret}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                Code authenticator à 6 chiffres
              </label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-brand-bg/50 border border-slate-200 dark:border-brand-border rounded-xl px-4 py-3 text-center text-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary transition-colors font-mono tracking-[0.5em]"
              />
            </div>

            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-brand-primary hover:bg-emerald-400 text-brand-bg font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Valider le MFA
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center gap-3 py-10 text-brand-primary">
            <CheckCircle2 className="w-10 h-10" />
            <p className="text-xs font-bold uppercase tracking-widest">Session MFA validée</p>
          </div>
        )}
      </div>
    </div>
  );
}
