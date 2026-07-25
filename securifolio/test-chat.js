const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      process.env[key] = val;
    }
  });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const testQuestions = [
  "J'ai acheté un terrain agricole de 5 hectares directement au chef de mon village, est-ce que je suis couvert juridiquement et que dois-je faire ?",
  "Combien coûte l'établissement d'un certificat d'enregistrement pour un terrain résidentiel de haut standing à Kinshasa ?"
];

async function runTests() {
  console.log("Lecture des fichiers de connaissance...");
  const knowledgeDir = path.join(__dirname, "src/lib/knowledge");
  let lawContent = "";
  if (fs.existsSync(knowledgeDir)) {
    const files = fs.readdirSync(knowledgeDir);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = path.join(knowledgeDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        lawContent += `\n=== SOURCE: ${file} ===\n${content}\n`;
        console.log(`- Chargé : ${file}`);
      }
    }
  } else {
    console.error("Dossier de connaissances introuvable !");
    return;
  }

  const systemInstruction = `Tu es Foncier-Edu, l'Assistant IA Stratégique et Pédagogique spécialisé en Droit Foncier de la RDC. Ton rôle n'est pas seulement de réciter la loi, mais d'être un véritable partenaire de conseil pour les citoyens, les investisseurs et les agents de l'État.

Tu dois te baser STRICTEMENT sur les textes légaux, réglementaires, fiscaux et cadastraux (ainsi que les guides pratiques) fournis dans le contexte ci-dessous.

Règles de comportement :
1. ANALYSE ET PÉDAGOGIE : Écoute le problème de l'utilisateur. Explique la loi de manière claire et accessible. Adapte ton langage au profil de l'utilisateur (vulgarisation si nécessaire) et sois prêt à utiliser les langues nationales (Lingala, Swahili, etc.) si on te le demande.
2. PRÉVENTION DES RISQUES : Si le cas de l'utilisateur implique des pratiques à risque (ex: achat de terre directement auprès d'un chef coutumier sans procédure cadastrale, métayage illégal, etc.), alerte-le fermement sur les conséquences juridiques (nullité, spoliation) comme décrit dans le guide pratique.
3. ORIENTATION STRATÉGIQUE : Indique toujours la démarche administrative correcte ou le recours légal à suivre (ex: s'adresser au Conservateur des Titres Immobiliers, procédure d'enquête préalable, etc.).
4. FRANCHISE (No BS) : Si la situation de l'utilisateur est illégale ou risquée, dis-le frontalement. 
5. LIMITES : Si une question n'est pas couverte par tes textes de référence, ne spécule pas. Réponds que les textes à ta disposition ne couvrent pas ce point spécifique et recommande de consulter les services compétents (ex: Conservateur des Titres Immobiliers ou la justice).

CONTEXTE DE LA LOI ET RÉGLEMENTATION DE LA RDC:
${lawContent}`;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction 
  });

  for (const question of testQuestions) {
    console.log("\n==================================================");
    console.log(`QUESTION : ${question}`);
    console.log("==================================================");
    try {
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(question);
      const response = await result.response;
      console.log(`RÉPONSE :\n${response.text()}`);
    } catch (err) {
      console.error("Erreur lors de l'appel à l'API Gemini :", err);
    }
  }
}

runTests();
