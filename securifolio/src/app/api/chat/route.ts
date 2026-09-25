import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
let cachedLawContent: string | null = null;

function getLawContent() {
  if (cachedLawContent !== null) return cachedLawContent;

  const knowledgeDir = path.join(process.cwd(), "src/lib/knowledge");
  let lawContent = "";

  try {
    if (fs.existsSync(knowledgeDir)) {
      const files = fs.readdirSync(knowledgeDir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const filePath = path.join(knowledgeDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          lawContent += `\n=== SOURCE: ${file} ===\n${content}\n`;
        }
      }
    }
  } catch (e) {
    console.error("Erreur de lecture des fichiers de connaissance:", e);
  }

  cachedLawContent = lawContent;
  return lawContent;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`chat:${ip}`, 12, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }

    let body;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
    }
    const { messages } = body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 200 ||
        messages.some(message => !message || !['user','assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > (message.role === 'user' ? 8000 : 120000)) ||
        messages.reduce((total, message) => total + message.content.length, 0) > 1000000 ||
        messages[messages.length - 1]?.role !== 'user' ) {
      return NextResponse.json(
        { error: "Historique de conversation invalide." },
        { status: 400 }
      );
    }
    
    const lawContent = getLawContent();

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

    // Get the model with system instructions
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction 
    });

    // Format chat history for Gemini API (must start with a 'user' message)
    const history: { role: string; parts: { text: string }[] }[] = [];
    let foundFirstUser = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages.slice(-19, -1).forEach((msg: any) => {
      if (msg.role === "user") {
        foundFirstUser = true;
      }
      if (foundFirstUser) {
        const role = msg.role === "user" ? "user" : "model";
        const previous = history[history.length - 1];
        if (previous?.role === role) previous.parts[0].text = (previous.parts[0].text + "\n\n" + msg.content).slice(-8000);
        else history.push({ role, parts: [{ text: msg.content.slice(0, 8000) }] });
      }
    });

    while (history.reduce((size, message) => size + message.parts[0].text.length, 0) > 56000) history.shift();
    while (history[0]?.role === 'model') history.shift();
    const chat = model.startChat({ history });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ role: "assistant", content: text });
  } catch (error) {
    console.error("Erreur API Gemini:", error);
    return NextResponse.json(
      { error: "Erreur lors de la communication avec l'IA." }, 
      { status: 500 }
    );
  }
}
