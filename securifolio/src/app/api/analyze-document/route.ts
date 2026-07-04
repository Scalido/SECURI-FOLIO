import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, base64Data, mimeType } = await req.json();

    if (!imageUrl && !base64Data) {
      return NextResponse.json({ error: 'L\'URL de l\'image ou les données base64 sont requises.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'La clé API Gemini est manquante.' }, { status: 500 });
    }

    let finalBase64 = base64Data;
    let finalMimeType = mimeType;

    // 1. Si une URL est passée (rétrocompatibilité), récupérer l'image
    if (imageUrl) {
      const imageResp = await fetch(imageUrl);
      if (!imageResp.ok) {
        throw new Error('Impossible de télécharger l\'image depuis l\'URL fournie.');
      }
      const arrayBuffer = await imageResp.arrayBuffer();
      finalBase64 = Buffer.from(arrayBuffer).toString('base64');
      finalMimeType = imageResp.headers.get('content-type') || 'image/jpeg';
    }

    // 2. Préparer le modèle Gemini Vision avec schéma JSON structuré
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            nom: { type: SchemaType.STRING },
            numero_cadastral: { type: SchemaType.STRING },
            volume: { type: SchemaType.STRING },
            folio: { type: SchemaType.STRING },
            circonscription: { type: SchemaType.STRING },
            superficie: { type: SchemaType.STRING },
            date_etablissement: { type: SchemaType.STRING },
            alerte_phenomene_folio: { type: SchemaType.BOOLEAN }
          },
          required: [
            "nom",
            "numero_cadastral",
            "volume",
            "folio",
            "circonscription",
            "superficie",
            "date_etablissement",
            "alerte_phenomene_folio"
          ]
        }
      }
    });

    // 3. Prompt
    const prompt = "Analyse ce certificat d'enregistrement foncier congolais ou document. Extrais le nom, le numéro d'enregistrement, le volume, le folio, la circonscription foncière, la superficie de la concession et la date d'établissement. Cherche visuellement toute trace de rature ou de blanc correcteur sur les chiffres. Si tu as un doute visuel, ajoute 'alerte_phenomene_folio: true'.";

    // 4. Appel à l'IA
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: finalBase64,
          mimeType: finalMimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      console.error('Erreur parsing JSON:', text);
      throw new Error("L'IA n'a pas retourné un JSON valide.");
    }

    // 5. Interroger Supabase pour la vérification Anti-Folio
    const dbVerification = {
      found: false,
      matches: {
        nom: false,
        volume: false,
        folio: false,
        circonscription: false
      },
      status: 'Inconnu', // 'Valide' | 'Litige' | 'Falsifié' | 'Inconnu'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbRecord: null as any
    };

    if (parsedJson.numero_cadastral) {
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('titres_fonciers')
          .select('*')
          .eq('numero_cadastral', parsedJson.numero_cadastral.trim());

        if (!dbError && dbData && dbData.length > 0) {
          // Trouver le meilleur match si plusieurs enregistrements
          let matchRecord = dbData[0];
          if (parsedJson.circonscription) {
            const exactCirconscriptionMatch = dbData.find(
              (r: { circonscription: string }) => r.circonscription?.toLowerCase().trim() === parsedJson.circonscription?.toLowerCase().trim()
            );
            if (exactCirconscriptionMatch) {
              matchRecord = exactCirconscriptionMatch;
            }
          }

          dbVerification.found = true;
          dbVerification.dbRecord = matchRecord;
          dbVerification.status = matchRecord.statut;

          // Comparaison insensible à la casse et aux espaces
          const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

          dbVerification.matches.nom = cleanStr(matchRecord.nom_proprietaire) === cleanStr(parsedJson.nom);
          dbVerification.matches.volume = cleanStr(matchRecord.volume) === cleanStr(parsedJson.volume);
          dbVerification.matches.folio = cleanStr(matchRecord.folio) === cleanStr(parsedJson.folio);
          dbVerification.matches.circonscription = cleanStr(matchRecord.circonscription) === cleanStr(parsedJson.circonscription);
        }
      } catch (dbErr) {
        console.error('Erreur lors de la vérification de la base de données:', dbErr);
      }
    }

    return NextResponse.json({ success: true, data: parsedJson, dbVerification });
  } catch (error: unknown) {
    console.error('Erreur Route API /analyze-document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'analyse du document';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
