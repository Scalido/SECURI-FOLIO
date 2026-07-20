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

  return true;
}

export async function getProfilesData() {
  if (!(await checkSuperviseurAccess())) return { error: "Non autorisé" };
  const adminAuthClient = createAdminClient();
  const supabase = createClient();

  // 1. Récupérer la liste absolue de tous les comptes de connexion
  const { data: usersData, error: usersError } = await adminAuthClient.auth.admin.listUsers();
  if (usersError) return { error: usersError.message };

  // 2. Récupérer les profils métiers
  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) return { error: profilesError.message };

  // 3. Fusionner les deux listes pour un affichage complet
  const mergedData = usersData.users.map(user => {
    const profile = profilesData?.find(p => p.id === user.id);
    return {
      id: user.id,
      email: user.email,
      created_at: new Date(user.created_at).toLocaleString('fr-FR'),
      last_sign_in: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais',
      role: profile?.role || 'citoyen (défaut)',
      circonscription: profile?.circonscription || '-'
    };
  });

  // Trier par date de création décroissante
  mergedData.sort((a, b) => new Date(usersData.users.find(u => u.id === b.id)?.created_at || 0).getTime() - new Date(usersData.users.find(u => u.id === a.id)?.created_at || 0).getTime());

  return { data: mergedData };
}

export async function getTitresFonciersData() {
  if (!(await checkSuperviseurAccess())) return { error: "Non autorisé" };
  const supabase = createClient();

  const { data, error } = await supabase
    .from('titres_fonciers')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return { error: error.message };
  return { data };
}

export async function getAntiFolioHistoryData() {
  if (!(await checkSuperviseurAccess())) return { error: "Non autorisé" };
  const supabase = createClient();

  const { data, error } = await supabase
    .from('anti_folio_history')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return { error: error.message };
  return { data };
}

export async function getSmartArchiveHistoryData() {
  if (!(await checkSuperviseurAccess())) return { error: "Non autorisé" };
  const supabase = createClient();

  const { data, error } = await supabase
    .from('smart_archive_history')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return { error: error.message };
  return { data };
}
