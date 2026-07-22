import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  const titles = [
    {
      numero_cadastral: '1178',
      nom_proprietaire: 'Mosele Mombanga',
      volume: 'AMA 171',
      folio: '68',
      circonscription: 'Limete',
      superficie: '3049 m²',
      statut: 'Valide',
      date_enregistrement: new Date('2020-09-14').toISOString()
    },
    {
      numero_cadastral: '2044',
      nom_proprietaire: 'Pierre Kasongo',
      volume: 'LUK 45',
      folio: '12',
      circonscription: 'Ngaliema',
      superficie: '320 m²',
      statut: 'Litige',
      date_enregistrement: new Date('2021-09-09').toISOString()
    }
  ];

  for (const title of titles) {
    const { data: existing } = await supabase
      .from('titres_fonciers')
      .select('id')
      .eq('numero_cadastral', title.numero_cadastral)
      .single();
    
    if (existing) {
      const { error } = await supabase
        .from('titres_fonciers')
        .update(title)
        .eq('id', existing.id);
      if (error) console.error(`Erreur maj pour ${title.numero_cadastral}:`, error.message);
      else console.log(`Mis à jour ${title.numero_cadastral}`);
    } else {
      const { error } = await supabase
        .from('titres_fonciers')
        .insert(title);
      if (error) console.error(`Erreur insert pour ${title.numero_cadastral}:`, error.message);
      else console.log(`Inséré ${title.numero_cadastral}`);
    }
  }
}

seed();
