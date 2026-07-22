'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function extractTitleData(formData: FormData) {
  try {
    const file = formData.get('document') as File
    
    if (!file) {
      return { success: false, error: 'Aucun document fourni.' }
    }

    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Clé API Gemini non configurée.' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Convert the File object to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')

    const prompt = `
Tu es un expert juridique et foncier de la République Démocratique du Congo.
Analyse ce certificat d'enregistrement / titre foncier et extrais les informations suivantes au format JSON strict :
- "numero_cadastral" : Le numéro de la parcelle (ex: 1178).
- "nom_proprietaire" : Le nom complet du concessionnaire/propriétaire.
- "volume" : Le volume du registre (ex: AMA 171).
- "folio" : Le folio du registre (ex: 68).
- "circonscription" : La commune ou circonscription foncière (ex: Limete).
- "superficie" : La superficie du terrain en m² ou ares (convertis tout en m² si possible).
- "date_enregistrement" : La date d'établissement du certificat.

Si une information est introuvable ou illisible, mets "Non détecté" ou "".
Ne retourne que le JSON, pas de markdown, pas d'explications autour.
`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ])

    const responseText = result.response.text()
    
    // Clean up potential markdown formatting in the response
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    const extractedData = JSON.parse(jsonString)

    return { 
      success: true, 
      data: {
        numero_cadastral: extractedData.numero_cadastral || '',
        nom: extractedData.nom_proprietaire || '',
        volume: extractedData.volume || '',
        folio: extractedData.folio || '',
        circonscription: extractedData.circonscription || '',
        superficie: extractedData.superficie || '',
        date_etablissement: extractedData.date_enregistrement || ''
      }
    }
  } catch (error) {
    console.error('Erreur d\'extraction IA:', error)
    return { success: false, error: 'Échec de l\'extraction par l\'IA.' }
  }
}
