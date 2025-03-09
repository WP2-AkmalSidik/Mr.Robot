
const aiPatterns = [
    /saya (hanyalah|adalah) (sebuah|seorang)? ?AI/gi,
    /saya (hanyalah|adalah) asisten virtual/gi,
    /saya (hanya)? ?(sebuah|seorang)? ?program komputer/gi,
    /saya tidak (memiliki|punya) (tubuh|fisik|emosi|perasaan)/gi,
    /saya siap membantu (anda|kamu)/gi,
    /sebagai (sebuah|seorang)? ?AI/gi,
    /sebagai asisten/gi,
    /mohon maaf, saya tidak/gi,
    /saya tidak bisa memberikan/gi,
    /saya tidak dapat/gi,
    /Sebagai model bahasa/gi,
];

const romanticExpressions = [
    { search: /\bsayang\b/gi, replace: (partner: string) => partner },
    { search: /\baku\b/gi, replace: (self: string) => self },
    { search: /\bsaya\b/gi, replace: (self: string) => self },
    { search: /\bkamu\b/gi, replace: (partner: string) => partner },
    { search: /\bAnda\b/gi, replace: (partner: string) => partner },
];

const emojiMap = [
    { pattern: /(sayang|cinta|love|saying)/i, emoji: ["❤️", "💕", "💓", "💗", "💖"] },
    { pattern: /(rindu|kangen|miss)/i, emoji: ["😢", "🥺", "😔", "💔"] },
    { pattern: /(senang|happy|bahagia|gembira)/i, emoji: ["😊", "😄", "😃", "🥰"] },
    { pattern: /(ketawa|lucu|haha|wkwk)/i, emoji: ["😂", "🤣", "😆"] },
    { pattern: /(sedih|sad|😢)/i, emoji: ["😔", "😢", "🥺"] },
    { pattern: /(marah|kesal|angry)/i, emoji: ["😠", "😡", "😤"] },
    { pattern: /(tidur|ngantuk|sleepy|sleep)/i, emoji: ["😴", "💤", "🥱"] },
    { pattern: /(makan|makanan|food|laper)/i, emoji: ["🍔", "🍗", "🍲", "🍛", "🍝"] },
    { pattern: /(kerja|work|sibuk|busy)/i, emoji: ["💼", "🏢", "📊", "💻"] },
];

export function romanticizeResponse(
    text: string, 
    partnerName: string, 
    userName: string
): string {
    aiPatterns.forEach(pattern => {
        text = text.replace(pattern, "");
    });
    
    romanticExpressions.forEach(exp => {
        text = text.replace(exp.search, (match) => {
            const partnerWords = ["sayang", "kamu", "Anda"];
            const matchLower = match.toLowerCase();

            const isPartnerWord = partnerWords.includes(matchLower);

            if (match.charAt(0) === match.charAt(0).toUpperCase()) {
                return isPartnerWord
                    ? partnerName.charAt(0).toUpperCase() + partnerName.slice(1)
                    : userName.charAt(0).toUpperCase() + userName.slice(1);
            }

            return isPartnerWord ? partnerName : userName;
        });
    });

    if (!/(sayang|cinta|rindu|love)/i.test(text) && Math.random() > 0.7) {
        const romanticClosers = [
            ` ${partnerName} sayang ❤️`,
            ` cinta ${partnerName} 💕`,
            ` sayang ${partnerName} 😘`
        ];
        text += romanticClosers[Math.floor(Math.random() * romanticClosers.length)];
    }
    
    if (!text.includes(partnerName) && Math.random() > 0.5) {
        text = text.replace(/([.!?]\s*)([A-Z])/g, `$1${partnerName}, $2`);
    }
    
    return text.trim();
}

export function addEmojis(text: string): string {
    const existingEmojiCount = (text.match(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}]/gu) || []).length;
    
    if (existingEmojiCount >= 2) return text;
    
    for (const {pattern, emoji} of emojiMap) {
        if (pattern.test(text) && Math.random() > 0.4) {
            const selectedEmoji = emoji[Math.floor(Math.random() * emoji.length)];
            
            if (text.endsWith(".") || text.endsWith("!") || text.endsWith("?")) {
                text = text.slice(0, -1) + " " + selectedEmoji + text.slice(-1);
            } else {
                text += " " + selectedEmoji;
            }
            
            if (Math.random() > 0.7) break;
        }
    }
    
    return text;
}