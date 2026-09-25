'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireMfaForSensitiveRole } from '@/lib/security/mfa';

export async function createAgentAccount(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont requis." };
  }

  // 1. Vérifier que l'utilisateur actuel est bien connecté et autorisé
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non autorisé. Vous devez être connecté." };
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  
  if (!adminEmails.includes(user.email?.toLowerCase() || "")) {
    return { error: "Accès refusé. Niveau d'accréditation Superviseur requis." };
  }

  const mfaError = await requireMfaForSensitiveRole(supabase, 'admin');
  if (mfaError) {
    return { error: mfaError };
  }

  // 2. Créer l'utilisateur via l'API Admin
  try {
    const adminAuthClient = createAdminClient();
    
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmé comme demandé
      user_metadata: {
        clearance: 'agent' // Métadonnée optionnelle pour le futur
      }
    });

    if (error) {
      console.error("Erreur création utilisateur:", error);
      return { error: error.message };
    }

    const { error: profileError } = await adminAuthClient
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email || email,
        role: 'agent',
      });

    if (profileError) {
      console.error("Erreur création profil agent:", profileError);
      await adminAuthClient.auth.admin.deleteUser(data.user.id);
      return { error: "Compte annulé : impossible de créer le profil agent associé." };
    }

    revalidatePath('/admin');
    return { success: true, message: `Le compte ${data.user.email} a été créé avec succès.` };
    
  } catch (error) {
    console.error("Erreur interne lors de la création:", error);
    return { error: "Une erreur interne est survenue. Vérifiez la clé SUPABASE_SERVICE_ROLE_KEY." };
  }
}

async function checkSuperviseurAccess() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return false;
  
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  if (!adminEmails.includes(user.email?.toLowerCase() || "")) return false;

  return !(await requireMfaForSensitiveRole(supabase, 'admin'));
}

// All privileged reads follow the server allowlist and MFA gate above.
async function readTable(table: 'profiles' | 'titres_fonciers' | 'anti_folio_history' | 'smart_archive_history') {
  if (!(await checkSuperviseurAccess())) return { error: 'Accès refusé ou authentification MFA requise.' };
  try {
    const admin = createAdminClient();
    const rows = [];
    for (let offset = 0; offset < 10000; offset += 1000) {
      const { data, error } = await admin.from(table).select('*').order('id').range(offset, offset + 999);
      if (error) return { error: 'Lecture du registre indisponible.' };
      rows.push(...(data || []));
      if (!data || data.length < 1000) return { data: rows };
    }
    return { error: 'Volume trop important pour cette vue. Un export paginé est nécessaire.' };
  } catch { return { error: 'Configuration du registre indisponible.' }; }
}

export async function getProfilesData() {
  if (!(await checkSuperviseurAccess())) return { error: 'Accès refusé ou authentification MFA requise.' };
  try {
    const admin = createAdminClient();
    const users = [];
    let complete = false;
    for (let page = 1; page <= 100; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) return { error: 'Liste des comptes indisponible.' };
      users.push(...data.users);
      if (data.users.length < 100) { complete = true; break; }
    }
    if (!complete) return { error: 'Volume trop important pour cette vue.' };
    const profiles = await readTable('profiles');
    if (!profiles.data) return { error: profiles.error };
    const byId = new Map(profiles.data.map(p => [p.id, p]));
    users.sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    return { data: users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: new Date(user.created_at).toLocaleString('fr-FR'),
      last_sign_in: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais',
      role: byId.get(user.id)?.role || 'Profil métier absent',
      circonscription: byId.get(user.id)?.circonscription || '-'
    })) };
  } catch { return { error: 'Configuration administrateur indisponible.' }; }
}

export async function getTitresFonciersData() { return readTable('titres_fonciers'); }
export async function getAntiFolioHistoryData() { return readTable('anti_folio_history'); }
export async function getSmartArchiveHistoryData() { return readTable('smart_archive_history'); }
