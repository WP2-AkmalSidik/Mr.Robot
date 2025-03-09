import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import dotenv from "dotenv";
import { generateResponse } from "./aiService";
import { 
  updateStatus, 
  getCurrentStatus, 
  getCurrentLocation, 
  updateLocation,
  addToMemory,
  getConversationContext,
  isCommand,
  processCommand,
  setWorkingStatus,
  setLunchStatus,
  setHomeStatus,
  setBusyStatus,
  setRelaxingStatus
} from "./stateManager";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    console.error("❌ Error: GROQ_API_KEY tidak ditemukan. Harap tambahkan ke file .env");
    process.exit(1);
}

const ALLOWED_NUMBER = "6285861664398@c.us"; 
const PARTNER_NAME = "Egaa";
const USER_NAME = "Akang";

function formatPhoneNumber(number: string): string {
    if (!number.endsWith('@c.us')) {
        number = number + '@c.us';
    }
    return number;
}

const client = new Client({
    restartOnAuthFail: true,
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html",
    },
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process", 
            "--disable-gpu",
        ],
    },
    authStrategy: new LocalAuth(),
});

let selfNumber = "";

client.on("qr", (qr) => {
    console.log("📱 Scan QR code untuk login WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("✅ WhatsApp Bot aktif! Siap menerima pesan.");
    
    try {
        const info = client.info;
        
        selfNumber = info.me ? info.me._serialized : "";
        if (!selfNumber && info.wid) {
            selfNumber = info.wid._serialized;
        }
        
        console.log(`✅ Self number identified: ${selfNumber}`);
        
        updateStatus("bekerja");
        updateLocation("di kantor");
        
        console.log(`🔹 Status awal: ${getCurrentStatus()}`);
        console.log(`🔹 Lokasi awal: ${getCurrentLocation()}`);
        
        if (selfNumber) {
            try {
                const chat = await client.getChatById(selfNumber);
                console.log(`✅ Self chat initialized: ${chat.name}`);
            } catch (error) {
                console.error("❌ Error saat mengatur self number:", (error as Error).message);
            }
        }
    } catch (error) {
        console.error("❌ Error saat mengatur self number:", error);
    }
});

const isAskingAboutActivity = (message: string): boolean => {
    return /sedang apa|lagi apa|lagi ngapain|lagi sibuk apa|apa kabar|kabar|sibuk/i.test(message);
};

const isAskingAboutLocation = (message: string): boolean => {
    return /dimana|lagi dimana|posisi|lokasi|tempat|posisi dimana/i.test(message);
};

const isGreeting = (message: string): boolean => {
    return /^(hai|halo|hi|hello|hey|pagi|siang|sore|malam|selamat|assalamualaikum).{0,10}$/i.test(message);
};

const isAskingAboutFeeling = (message: string): boolean => {
    return /gimana kabar|baik baik saja|sehat|keadaan|kondisi|okey|okay|ok|baik/i.test(message);
};

const isExpressingLove = (message: string): boolean => {
    return /sayang|cinta|rindu|kangen|miss you|love|suka/i.test(message);
};

const isFromSelf = (msg: Message): boolean => {
    if (msg.fromMe) {
        return true;
    }
    
    if (selfNumber && msg.from === selfNumber) {
        return true;
    }
    
    return false;
};

client.on("message", async (msg: Message) => {
    console.log(`📩 Pesan dari: ${msg.from} | fromMe: ${msg.fromMe} | 💬 ${msg.body}`);
    
    try {
        
        if (isFromSelf(msg)) {
            console.log(`🛠️ Menerima pesan dari nomor sendiri: ${msg.body}`);
            
            if (msg.body.startsWith('/')) {
                const [command, ...args] = msg.body.slice(1).split(' ');
                const argText = args.join(' ');
                
                let response = "Perintah tidak dikenali";
                
                if (command.toLowerCase() === "status") {
                    updateStatus(argText);
                    response = `✅ Status berhasil diubah menjadi: ${argText}`;
                } 
                else if (command.toLowerCase() === "lokasi") {
                    updateLocation(argText);
                    response = `✅ Lokasi berhasil diubah menjadi: ${argText}`;
                }
                else if (command.toLowerCase() === "reset") {
                    setWorkingStatus();
                    response = "✅ Status dan lokasi direset ke default (bekerja di kantor)";
                }
                else if (command.toLowerCase() === "bantuan" || command.toLowerCase() === "help") {
                    response = `📋 Daftar Perintah:
/status [status] - Mengubah status saat ini
/lokasi [lokasi] - Mengubah lokasi saat ini
/reset - Kembali ke status default
/bantuan - Menampilkan bantuan ini`;
                }
                else if (command.toLowerCase() === "info") {
                    const info = client.info;
                    const detailedInfo = JSON.stringify(info, null, 2);
                    console.log("Detailed Client Info:", detailedInfo);
                    
                    const msgInfo = JSON.stringify({
                        from: msg.from,
                        fromMe: msg.fromMe,
                        id: msg.id
                    }, null, 2);
                    
                    response = `Self number: ${selfNumber}\nMessage from: ${msg.from}\nfromMe: ${msg.fromMe}\nStatus: ${getCurrentStatus()}\nLokasi: ${getCurrentLocation()}`;
                }
                
                console.log(`💬 Response untuk perintah self: ${response}`);
                await client.sendMessage(msg.from, response);
            }
        }
        
        
        if (msg.from !== ALLOWED_NUMBER) {
            console.log(`🚫 Pesan dari ${msg.from} diabaikan.`);
            return;
        }

        if (msg.from === ALLOWED_NUMBER) {
            const chat = await msg.getChat();
            chat.sendStateTyping();
            
            let response = "";
            
            if (msg.body.startsWith('/')) {
                const [command, ...args] = msg.body.slice(1).split(' ');
                const argText = args.join(' ');
                
                if (command.toLowerCase() === "status") {
                    updateStatus(argText);
                    response = `✅ Status berhasil diubah menjadi: ${argText}`;
                } 
                else if (command.toLowerCase() === "lokasi") {
                    updateLocation(argText);
                    response = `✅ Lokasi berhasil diubah menjadi: ${argText}`;
                }
                else if (command.toLowerCase() === "reset") {
                    setWorkingStatus();
                    response = "✅ Status dan lokasi direset ke default (bekerja di kantor)";
                }
                else if (command.toLowerCase() === "bantuan" || command.toLowerCase() === "help") {
                    response = `📋 Daftar Perintah:
/status [status] - Mengubah status saat ini
/lokasi [lokasi] - Mengubah lokasi saat ini
/reset - Kembali ke status default
/bantuan - Menampilkan bantuan ini`;
                }
                else {
                    response = processCommand(msg.body);
                }
                
                console.log(`🛠️ Perintah dijalankan: ${msg.body}`);
            } 
            else {
                addToMemory(msg.from, `${PARTNER_NAME}: ${msg.body}`);
                
                if (isAskingAboutActivity(msg.body)) {
                    response = `Lagi ${getCurrentStatus()} nih ${PARTNER_NAME} 😊 tapi tetap mikirin kamu kok.`;
                } 
                else if (isAskingAboutLocation(msg.body)) {
                    response = `${USER_NAME} lagi ${getCurrentLocation()} sekarang, ${PARTNER_NAME} sayang 🏠 kamu dimana?`;
                }
                else if (isGreeting(msg.body)) {
                    const greetings = [
                        `Hai ${PARTNER_NAME} sayangku 💕 apa kabar?`,
                        `Halo ${PARTNER_NAME} cantik 😍 kangen nih sama kamu`,
                        `Hey ${PARTNER_NAME} 😊 senang banget kamu chat ${USER_NAME}`,
                        `${PARTNER_NAME} sayang 💖 ${USER_NAME} kangen banget sama kamu`
                    ];
                    response = greetings[Math.floor(Math.random() * greetings.length)];
                }
                else if (isAskingAboutFeeling(msg.body)) {
                    response = `${USER_NAME} baik-baik aja kok ${PARTNER_NAME} sayangku, apalagi kalau lagi chat sama kamu gini 😊 kamu gimana? sehat kan?`;
                }
                else if (isExpressingLove(msg.body)) {
                    const loveResponses = [
                        `${USER_NAME} juga sayang banget sama ${PARTNER_NAME} 💗 selalu di hati kamu`,
                        `Kamu tuh segalanya buat ${USER_NAME}, ${PARTNER_NAME} sayang 💕`,
                        `${USER_NAME} juga kangen banget sama ${PARTNER_NAME}. Pengen ketemu langsung 🥰`,
                        `Love you too ${PARTNER_NAME} sayangku 💓 kamu selalu bikin ${USER_NAME} semangat`
                    ];
                    response = loveResponses[Math.floor(Math.random() * loveResponses.length)];
                }
                else {
                    console.log("✅ Memproses AI...");
                    
                    const context = getConversationContext(msg.from);
                    
                    response = await generateResponse(
                        msg.body, 
                        context, 
                        PARTNER_NAME, 
                        USER_NAME, 
                        getCurrentStatus(),
                        getCurrentLocation()
                    );
                }
                
                addToMemory(msg.from, `${USER_NAME}: ${response}`);
            }

            const typingDelay = Math.floor(Math.random() * 1000) + 500;
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            chat.clearState();
            
            console.log(`💬 Jawaban: ${response}`);
            await client.sendMessage(msg.from, response);
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
        if (msg.from === ALLOWED_NUMBER) {
            await client.sendMessage(msg.from, `Aduh ${PARTNER_NAME}, ${USER_NAME} lagi ada masalah dengan HP. Nanti ${USER_NAME} chat lagi ya sayang 😘`);
        } else if (isFromSelf(msg)) {
            await client.sendMessage(msg.from, "Terjadi kesalahan dalam memproses perintah. Silakan coba lagi.");
        }
    }
});

client.on("message_create", async (msg: Message) => {
    if (msg.fromMe && msg.body.startsWith('/')) {
        console.log(`📤 Pesan dikirim oleh saya: ${msg.body}`);
        
        try {
            const [command, ...args] = msg.body.slice(1).split(' ');
            const argText = args.join(' ');
            
            let response = "";
            
            if (command.toLowerCase() === "status") {
                updateStatus(argText);
                response = `✅ Status berhasil diubah menjadi: ${argText}`;
            } 
            else if (command.toLowerCase() === "lokasi") {
                updateLocation(argText);
                response = `✅ Lokasi berhasil diubah menjadi: ${argText}`;
            }
            else if (command.toLowerCase() === "reset") {
                setWorkingStatus();
                response = "✅ Status dan lokasi direset ke default (bekerja di kantor)";
            }
            else if (command.toLowerCase() === "bantuan" || command.toLowerCase() === "help") {
                response = `📋 Daftar Perintah:
/status [status] - Mengubah status saat ini
/lokasi [lokasi] - Mengubah lokasi saat ini
/reset - Kembali ke status default
/bantuan - Menampilkan bantuan ini`;
            }
            else if (command.toLowerCase() === "info") {
                response = `Self number: ${selfNumber}\nStatus: ${getCurrentStatus()}\nLokasi: ${getCurrentLocation()}`;
            }
            
            if (response) {
                console.log(`💬 Response untuk self command: ${response}`);
                await client.sendMessage(msg.to, response);
            }
        } catch (error) {
            console.error("❌ Error saat memproses pesan sendiri:", error);
        }
    }
});

client.initialize();

export function updateBotStatus(status: string): void {
    updateStatus(status);
    console.log(`✅ Status updated to: ${status}`);
}

export function updateBotLocation(location: string): void {
    updateLocation(location);
    console.log(`✅ Location updated to: ${location}`);
}