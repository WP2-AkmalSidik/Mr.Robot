import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import commands from "./commands";

const client = new Client({
    restartOnAuthFail: true,
    webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html",
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

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    // Check if message contains text 'share location, bro!'
    if (msg.body.toLowerCase().trim() === "ga percaya, coba serlok") {
        // Send location
        await client.sendMessage(msg.from, "Tunggu bentar...");
        
        const latitude = -7.377534472633078;
        const longitude = 108.23873367774264;
        const location = `${latitude},${longitude}`;

        const quotedMessageId = msg.id ? msg.id._serialized : undefined;
        const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        await client.sendMessage(msg.from, `Nih lagi disini ${googleMapsLink}`, {
            quotedMessageId
        });
        await client.sendMessage(msg.from, "gmna? percaya kann?");
    }

    for (const command of commands) {
        command.handle(msg);
    }
});

client.initialize();
