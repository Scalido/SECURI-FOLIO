export function roleLabel(role: string | null) {
  switch (role) {
    case 'admin': return 'Admin'
    case 'superviseur': return 'Superviseur'
    case 'chef_cadastre': return 'Chef Cadastre'
    case 'conservateur': return 'Conservateur'
    case 'notaire': return 'Notaire'
    case 'citoyen': return 'Citoyen'
    case 'agent': return 'Agent Foncier'
    default: return 'Profil indisponible'
  }
}

export function roleDestination(role: string | null) {
  if (role === 'admin' || role === 'superviseur') return '/admin'
  if (role === 'chef_cadastre') return '/cadastre-dashboard'
  if (role === 'conservateur') return '/conservateur-dashboard'
  return '/smart-archive'
}
