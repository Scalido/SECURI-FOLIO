type MfaAssuranceResponse = {
  data: {
    currentLevel?: string | null
  } | null
  error: {
    message: string
  } | null
}

type SupabaseMfaClient = {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: () => Promise<MfaAssuranceResponse>
    }
  }
}

const SENSITIVE_ROLES = new Set(['admin', 'chef_cadastre', 'conservateur'])

export async function requireMfaForSensitiveRole(supabase: SupabaseMfaClient, role: string) {
  if (!SENSITIVE_ROLES.has(role)) return null

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) {
    console.error('Erreur vérification MFA:', error)
    return 'Impossible de vérifier le niveau MFA de la session.'
  }

  if (data?.currentLevel !== 'aal2') {
    return 'Authentification MFA requise pour ce rôle sensible.'
  }

  return null
}
