
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
  setRelaxingStatus,
  getBotActiveStatus,
  setBotActive,
  setBotInactive,
  addLastQuestion,
  getLastQuestion,
  resetLastQuestion
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
        setBotActive();
        
        console.log(`🔹 Status awal: ${getCurrentStatus()}`);
        console.log(`🔹 Lokasi awal: ${getCurrentLocation()}`);
        console.log(`🔹 Bot aktif: ${getBotActiveStatus()}`);
        
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
    const activityPatterns = [
        /sedang apa/i,
        /lagi apa/i,
        /lagi ngapain/i,
        /lagi sibuk apa/i,
        /sibuk/i,
        /ngapain/i,
        /aktivitas/i,
        /kegiatan/i,
        /kesibukan/i
    ];
    
    return activityPatterns.some(pattern => pattern.test(message));
};

const isAskingAboutLocation = (message: string): boolean => {
    const locationPatterns = [
        /dimana/i,
        /lagi dimana/i,
        /posisi/i,
        /lokasi/i,
        /tempat/i,
        /posisi dimana/i,
        /berada/i,
        /ada di/i
    ];
    
    return locationPatterns.some(pattern => pattern.test(message));
};

const isGreeting = (message: string): boolean => {
    const greetingPatterns = [
        /^(hai|halo|hi|hello|hey|pagi|siang|sore|malam|selamat|assalamualaikum).{0,15}$/i
    ];
    
    return greetingPatterns.some(pattern => pattern.test(message));
};

const isAskingAboutFeeling = (message: string): boolean => {
    const feelingPatterns = [
        /gimana kabar/i,
        /kabar(nya)?/i,
        /baik[\s-]?baik/i,
        /sehat/i,
        /keadaan/i,
        /kondisi/i,
        /okey/i,
        /okay/i,
        /ok/i,
        /baik/i,
        /bagaimana/i,
        /apa kabar/i,
        /gimana/i
    ];
    
    return feelingPatterns.some(pattern => pattern.test(message));
};

const isExpressingLove = (message: string): boolean => {
    const lovePatterns = [
        /sayang/i,
        /cinta/i,
        /rindu/i,
        /kangen/i,
        /miss you/i,
        /love/i,
        /suka/i,
        /❤️|💕|💓|💗|💖/
    ];
    
    return lovePatterns.some(pattern => pattern.test(message));
};

const isAskingPermission = (message: string): boolean => {
    const permissionPatterns = [
        /boleh/i,
        /bisa/i,
        /mau/i,
        /izin/i,
        /perbolehkan/i,
        /diperkenankan/i,
        /memungkinkan/i
    ];
    
    return permissionPatterns.some(pattern => pattern.test(message));
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
                else if (command.toLowerCase() === "stop") {
                    setBotInactive();
                    response = "✅ Bot dinonaktifkan. Pesan tidak akan dibalas otomatis.";
                    
                    if (ALLOWED_NUMBER) {
                        await client.sendMessage(ALLOWED_NUMBER, `${PARTNER_NAME} sayang, ${USER_NAME} sudah online dan membuka WhatsApp sekarang 😊, jadi akang yang akan membalasnya.`);
                    }
                }
                else if (command.toLowerCase() === "run") {
                    setBotActive();
                    response = "✅ Bot diaktifkan kembali. Pesan akan dibalas otomatis.";
                    
                    if (ALLOWED_NUMBER) {
                        await client.sendMessage(ALLOWED_NUMBER, `${PARTNER_NAME} sayang, ${USER_NAME} offline dulu yaa 😔. Tapi tenang ada aku yang akan nemanin ${PARTNER_NAME} kesayangan Kang Akmal 😊`);
                    }
                }
                else if (command.toLowerCase() === "bantuan" || command.toLowerCase() === "help") {
                    response = `📋 Daftar Perintah:
/status [status] - Mengubah status saat ini
/lokasi [lokasi] - Mengubah lokasi saat ini
/reset - Kembali ke status default
/stop - Menonaktifkan bot (tidak membalas otomatis)
/run - Mengaktifkan bot kembali (membalas otomatis)
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
                    
                    response = `Self number: ${selfNumber}\nMessage from: ${msg.from}\nfromMe: ${msg.fromMe}\nStatus: ${getCurrentStatus()}\nLokasi: ${getCurrentLocation()}\nBot aktif: ${getBotActiveStatus()}`;
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
                if (!getBotActiveStatus()) {
                    console.log("🔴 Bot dalam keadaan tidak aktif, pesan tidak dibalas");
                    return;
                }
                
                addToMemory(msg.from, `${PARTNER_NAME}: ${msg.body}`);
                
                const lastQuestion = getLastQuestion();
                const currentMessage = msg.body.toLowerCase();
                
                if (isAskingAboutActivity(currentMessage)) {
                    const activityResponses = [
                        `Lagi ${getCurrentStatus()} nih ${PARTNER_NAME} 😊 tapi tetap mikirin kamu kok.`,
                        `${USER_NAME} sedang ${getCurrentStatus()} sekarang. Kalo ${PARTNER_NAME} lagi ngapain?`,
                        `Lagi ${getCurrentStatus()} sekarang, ${PARTNER_NAME} jangan kangen dulu ya ${USER_NAME} 💕`,
                        `${USER_NAME} sedang ${getCurrentStatus()}, tapi masih sempet buat balas chat ${PARTNER_NAME} kesayangan 😊`
                    ];
                    response = activityResponses[Math.floor(Math.random() * activityResponses.length)];
                    addLastQuestion("activity");
                } 
                else if (isAskingAboutLocation(currentMessage)) {
                    const locationResponses = [
                        `${USER_NAME} lagi ${getCurrentLocation()} sekarang, ${PARTNER_NAME} sayang 🏠 kamu dimana?`,
                        `Sekarang ${USER_NAME} ada ${getCurrentLocation()}, ${PARTNER_NAME}. Kamu lagi dimana?`,
                        `${getCurrentLocation()} nih, ${PARTNER_NAME}. Kalo ${PARTNER_NAME} dimana sekarang?`,
                        `${USER_NAME} lagi ${getCurrentLocation()} sekarang. Pengen ketemu ${PARTNER_NAME} nih 🥺`
                    ];
                    response = locationResponses[Math.floor(Math.random() * locationResponses.length)];
                    addLastQuestion("location");
                }
                else if (isGreeting(currentMessage)) {

                    const greetings = [
                        `Hai ${PARTNER_NAME} sayangku 💕 apa kabar?`,
                        `Halo ${PARTNER_NAME} cantik 😍 kangen nih sama kamu`,
                        `Hey ${PARTNER_NAME} 😊 senang banget kamu chat ${USER_NAME}`,
                        `${PARTNER_NAME} sayang 💖 ${USER_NAME} kangen banget sama kamu`,
                        `Haii ${PARTNER_NAME} 💕 lagi apa sekarang?`
                    ];
                    response = greetings[Math.floor(Math.random() * greetings.length)];
                    addLastQuestion("greeting");
                }
                else if (isAskingAboutFeeling(currentMessage)) {
                    if (lastQuestion === "feeling") {
                        const followUpResponses = [
                            `${USER_NAME} baik-baik aja kok, ${PARTNER_NAME} sayangku. Kamu gimana? Udah makan?`,
                            `${USER_NAME} sehat dan bahagia, apalagi kalau lagi chat sama ${PARTNER_NAME} 🥰`,
                            `Alhamdulillah ${USER_NAME} sehat. ${PARTNER_NAME} juga sehat kan? Jangan lupa jaga kesehatan ya 😊`,
                            `${USER_NAME} baik kok. Enak ya bisa ngobrol santai sama ${PARTNER_NAME} gini 💕`
                        ];
                        response = followUpResponses[Math.floor(Math.random() * followUpResponses.length)];
                    } else {
                        const feelingResponses = [
                            `${USER_NAME} baik-baik aja kok ${PARTNER_NAME} sayangku, apalagi kalau lagi chat sama kamu gini 😊 kamu gimana? sehat kan?`,
                            `Alhamdulillah ${USER_NAME} sehat, ${PARTNER_NAME} sayang. Kamu gimana? Sehat juga kan?`,
                            `${USER_NAME} baik kok, makin baik karena kamu tanya kabar ${USER_NAME} 💕 kamu gimana?`,
                            `${USER_NAME} sehat kok. Kamu sendiri gimana? Sehat kan ${PARTNER_NAME} sayang?`
                        ];
                        response = feelingResponses[Math.floor(Math.random() * feelingResponses.length)];
                    }
                    addLastQuestion("feeling");
                }
                else if (isExpressingLove(currentMessage)) {
                    const loveResponses = [
                        `${USER_NAME} juga sayang banget sama ${PARTNER_NAME} 💗 selalu di hati kamu`,
                        `Kamu tuh segalanya buat ${USER_NAME}, ${PARTNER_NAME} sayang 💕`,
                        `${USER_NAME} juga kangen banget sama ${PARTNER_NAME}. Pengen ketemu langsung 🥰`,
                        `Love you too ${PARTNER_NAME} sayangku 💓 kamu selalu bikin ${USER_NAME} semangat`,
                        `${USER_NAME} selalu sayang sama ${PARTNER_NAME}, gak akan pernah berubah 💖`
                    ];
                    response = loveResponses[Math.floor(Math.random() * loveResponses.length)];
                    addLastQuestion("love");
                }
                else if (isAskingPermission(currentMessage)) {
                    if (currentMessage.includes("cerita") || currentMessage.includes("bercerita")) {
                        response = `Boleh banget ${PARTNER_NAME} sayang, ${USER_NAME} selalu siap dengerin cerita kamu 😊 Cerita apa?`;
                    } else if (currentMessage.includes("nanya") || currentMessage.includes("tanya")) {
                        response = `Tentu boleh ${PARTNER_NAME} sayang, kamu mau nanya apa ke ${USER_NAME}? 😊`;
                    } else {
                        const permissionResponses = [
                            `Boleh banget ${PARTNER_NAME} sayang, ${USER_NAME} selalu ada buat kamu 💕`,
                            `Tentu boleh ${PARTNER_NAME}, ${USER_NAME} selalu siap buat kamu 😊`,
                            `Iya boleh, ${PARTNER_NAME} sayang. ${USER_NAME} siap dengerin 💖`,
                            `Boleh dong ${PARTNER_NAME} sayang, apapun untuk kamu 🥰`
                        ];
                        response = permissionResponses[Math.floor(Math.random() * permissionResponses.length)];
                    }
                    addLastQuestion("permission");
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
                    
                    resetLastQuestion();
                }
                
                addToMemory(msg.from, `${USER_NAME}: ${response}`);
            }

            const messageLength = response.length;
            const typingDelay = Math.min(Math.floor(messageLength * (50 + Math.random() * 100)), 3000);
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
            else if (command.toLowerCase() === "stop") {
                setBotInactive();
                response = "✅ Bot dinonaktifkan. Pesan tidak akan dibalas otomatis.";
                
                if (ALLOWED_NUMBER) {
                    await client.sendMessage(ALLOWED_NUMBER, `${PARTNER_NAME} sayang, ${USER_NAME} sudah online dan membuka WhatsApp sekarang 😊`);
                }
            }
            else if (command.toLowerCase() === "run") {
                setBotActive();
                response = "✅ Bot diaktifkan kembali. Pesan akan dibalas otomatis.";
                
                if (ALLOWED_NUMBER) {
                    await client.sendMessage(ALLOWED_NUMBER, `${PARTNER_NAME} sayang, ${USER_NAME} sedang offline sekarang. Mohon tunggu responnya ya 😊`);
                }
            }
            else if (command.toLowerCase() === "bantuan" || command.toLowerCase() === "help") {
                response = `📋 Daftar Perintah:
/status [status] - Mengubah status saat ini
/lokasi [lokasi] - Mengubah lokasi saat ini
/reset - Kembali ke status default
/stop - Menonaktifkan bot (tidak membalas otomatis)
/run - Mengaktifkan bot kembali (membalas otomatis)
/bantuan - Menampilkan bantuan ini`;
            }
            else if (command.toLowerCase() === "info") {
                response = `Self number: ${selfNumber}\nStatus: ${getCurrentStatus()}\nLokasi: ${getCurrentLocation()}\nBot aktif: ${getBotActiveStatus()}`;
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