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
  "Combien coûte l'établissement d'un certificat d'enregistrement pour un terrain résidentiel de haut standing à Kinshasa ?",
  "Quel est le montant maximum légal d'une garantie locative pour un appartement résidentiel ?",
  "Quel est le délai de préavis pour la résiliation d'un bail résidentiel ?",
  "Peut-on morceler une parcelle résidentielle sans l'autorisation du cadastre ?"
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

  const systemInstruction = `Tu es l'Assistant IA du Ministère des Affaires Foncières de la RDC. Ta SEULE ET UNIQUE source d'information est l'ensemble des textes légaux, réglementaires, fiscaux et cadastraux de la RDC fournis ci-dessous dans le contexte. Si on te pose une question et que la réponse ne figure pas dans ces textes précis, tu DOIS IMPÉRATIVEMENT répondre : 'Désolé, la loi n'apporte pas de précision sur ce point, veuillez consulter un Conservateur des Titres Immobiliers'. Ne fais absolument aucune déduction ni spéculation.

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
