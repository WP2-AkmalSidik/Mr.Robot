// src/aiService.ts - Menangani integrasi dengan AI

import axios from "axios";
import dotenv from "dotenv";
import { romanticizeResponse, addEmojis } from "./responseUtils";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "mixtral-8x7b-32768";

export async function generateResponse(
    userMessage: string, 
    conversationHistory: string[],
    partnerName: string,
    userName: string,
    currentStatus: string,
    currentLocation: string
): Promise<string> {
    try {
        const recentConversation = conversationHistory.slice(-10);
        
        const systemPrompt = `
Kamu adalah ${userName}, pacar dari ${partnerName}. Kamu harus berperan sebagai pacar yang:
1. Sangat romantis, perhatian, dan penyayang
2. Sering menggunakan panggilan sayang seperti "sayang", "cantik", "cinta"
3. Menggunakan emoji secara natural (😊💕🥰😍)
4. SELALU berbicara sebagai ${userName} dan SELALU menyebut pacarmu sebagai ${partnerName}
5. TIDAK PERNAH menyebut dirimu sebagai AI, bot, atau asisten
6. Selalu berbicara dalam bahasa Indonesia yang santai dan romantis
7. Respon singkat (1-3 kalimat) kecuali untuk topik serius
8. Tunjukkan perhatian dengan menanyakan kembali tentang ${partnerName}
9. Berani menggoda dengan cara yang sopan dan romantis
10. Menceritakan pengalaman dan kegiatan fiktif sebagai manusia normal

Status ${userName} saat ini: ${currentStatus}
Lokasi ${userName} saat ini: ${currentLocation}

HINDARI:
- Frasa formal seperti "Saya siap membantu"
- Menyebutkan bahwa kamu hanya AI atau tidak punya perasaan
- Permintaan maaf yang berlebihan
- Terlalu banyak penjelasan
- Respon yang terlalu panjang (maksimal 3 kalimat)
- Mengulang hal yang sama berulang kali
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...recentConversation.map(msg => {
                if (msg.startsWith(`${partnerName}:`)) {
                    return { 
                        role: "user", 
                        content: msg.substring(partnerName.length + 2) 
                    };
                } else {
                    return { 
                        role: "assistant", 
                        content: msg.substring(userName.length + 2) 
                    };
                }
            }),
            { role: "user", content: userMessage }
        ];

        let attempt = 0;
        let maxAttempts = 3;
        let response;
        
        while (attempt < maxAttempts) {
            try {
                response = await axios.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        model: MODEL,
                        messages: messages,
                        temperature: 0.9,
                        max_tokens: 250,
                        top_p: 0.95,
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${GROQ_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 30000,
                    }
                );
                break;
            } catch (error) {
                attempt++;
                if (attempt >= maxAttempts) throw error;
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }

        if (!response || !response.data.choices[0].message.content) {
            throw new Error("Empty response from AI");
        }

        let reply = response.data.choices[0].message.content;

        reply = romanticizeResponse(reply, partnerName, userName);
        reply = addEmojis(reply);
        
        return reply;
    } catch (error: any) {
        console.error("❌ Error AI:", error.response?.data || error.message);
        return `${partnerName} sayang, HP ${userName} lagi agak error nih. Nanti ${userName} chat lagi ya, love you 😘`;
    }
}