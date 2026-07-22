import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDB() {
  console.log("Tentative de suppression de SU/GOM/1023 et SU/KIM/871...");
  
  const ids = ['SU/GOM/1023', 'SU/KIM/871'];
  
  for (const id of ids) {
    const { data, error } = await supabase
      .from('titres_fonciers')
      .delete()
      .eq('numero_cadastral', id);
      
    if (error) {
      console.error(`Erreur pour ${id}:`, error.message);
    } else {
      console.log(`Succès: Les entrées pour ${id} ont été supprimées ou n'existaient pas.`);
    }
  }
  
  console.log("Terminé.");
}

cleanDB();
