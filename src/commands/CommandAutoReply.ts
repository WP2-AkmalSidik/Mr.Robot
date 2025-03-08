import { Message } from "whatsapp-web.js";
import Command from "./Command";

export class CommandAutoReply extends Command {
    private responses: { [key: string]: string };

    constructor() {
        super('auto-reply', 'Balasan otomatis berdasarkan pesan tertentu', [], false); // Tidak butuh prefix
        this.responses = {
            "mal": "uy",
            "saha iye": "iye bot watsapp",
            "sayaanggg": "ada apaa?\n_Saya bot yang akan membalas sementara ketika *Akmal* sibuk/tidak membuka WhatsApp_",
            "emang dia lagi dimana?": "Di rumah, seperti biasa. Tenang saja, jangan overthinking. 😏",
            "lagi sibuk ngapain sih?": "Kalau nggak nonton tutorial ngoding, pasti lagi ngoding. \nkalau udah beres atau lagi error pasti buka wa nya kok, tenang jangan dulu tantrum",
            "iya percaya": "Terimakasih telah percaya, tunggu si bos nyalse yaa.\nAtau kamu bisa chattingan sama aku aja, gimana?",
            "ga mau": "ywdah -_-",
            "hhe":"dih 🙄",
            "makasih yaa": "Iya sama-sama.",
            "thanks": "You're welcome! If you need anything else, just let me know."
        };
    }

    execute(msg: Message, args: string[]): void {
        const receivedMessage = msg.body.toLowerCase().trim(); // Normalisasi pesan
        if (this.responses[receivedMessage]) {
            msg.reply(this.responses[receivedMessage]);
        }
    }
}
