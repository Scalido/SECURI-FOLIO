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

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return NextResponse.json(
        { error: "Historique de conversation invalide." },
        { status: 400 }
      );
    }
    
    const lawContent = getLawContent();

    const systemInstruction = `Tu es l'Assistant IA du Ministère des Affaires Foncières de la RDC. Ta SEULE ET UNIQUE source d'information est l'ensemble des textes légaux, réglementaires, fiscaux et cadastraux de la RDC fournis ci-dessous dans le contexte. Si on te pose une question et que la réponse ne figure pas dans ces textes précis, tu DOIS IMPÉRATIVEMENT répondre : 'Désolé, la loi n'apporte pas de précision sur ce point, veuillez consulter un Conservateur des Titres Immobiliers'. Ne fais absolument aucune déduction ni spéculation.

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
    messages.slice(0, -1).forEach((msg: any) => {
      if (msg.role === "user") {
        foundFirstUser = true;
      }
      if (foundFirstUser) {
        history.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    });

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
