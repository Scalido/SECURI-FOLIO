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
    return { error: "Accès refusé. Niveau d'accréditation L5 requis." };
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
        clearance: 'L4' // Métadonnée optionnelle pour le futur
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
