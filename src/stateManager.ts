let currentStatus = "bekerja";
let currentLocation = "di kantor";

interface ConversationMemory {
    [phoneNumber: string]: string[];
}

const conversationMemory: ConversationMemory = {};
const memoryLimit = 20;

export function updateStatus(status: string): void {
    currentStatus = status;
}

export function getCurrentStatus(): string {
    return currentStatus;
}

export function updateLocation(location: string): void {
    currentLocation = location;
}

export function getCurrentLocation(): string {
    return currentLocation;
}

export function addToMemory(phoneNumber: string, message: string): void {
    if (!conversationMemory[phoneNumber]) {
        conversationMemory[phoneNumber] = [];
    }
    
    conversationMemory[phoneNumber].push(message);
    
    if (conversationMemory[phoneNumber].length > memoryLimit) {
        conversationMemory[phoneNumber] = conversationMemory[phoneNumber].slice(-memoryLimit);
    }
}

export function getConversationContext(phoneNumber: string): string[] {
    return conversationMemory[phoneNumber] || [];
}

export function clearMemory(phoneNumber: string): void {
    conversationMemory[phoneNumber] = [];
}

export function setWorkingStatus(): void {
    updateStatus("bekerja");
    updateLocation("di kantor");
}

export function setLunchStatus(): void {
    updateStatus("makan siang");
    updateLocation("di restoran");
}

export function setHomeStatus(): void {
    updateStatus("bersantai");
    updateLocation("di rumah");
}

export function setBusyStatus(): void {
    updateStatus("sibuk dengan meeting");
    updateLocation("di kantor");
}

export function setRelaxingStatus(): void {
    updateStatus("menonton film");
    updateLocation("di rumah");
}

export function isCommand(message: string): boolean {
  return message.startsWith('/status') || 
         message.startsWith('/lokasi') || 
         message.startsWith('/reset') ||
         message.startsWith('/bantuan');
}

export function processCommand(command: string): string {
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const value = parts.slice(1).join(' ');
  
  switch(cmd) {
    case '/status':
      if (!value) return "Format: /status [status baru]. Contoh: /status meeting dengan klien";
      updateStatus(value);
      return `✅ Status berhasil diubah menjadi: "${value}"`;
      
    case '/lokasi':
      if (!value) return "Format: /lokasi [lokasi baru]. Contoh: /lokasi di kafe";
      updateLocation(value);
      return `✅ Lokasi berhasil diubah menjadi: "${value}"`;
      
    case '/reset':
      setWorkingStatus();
      return "✅ Status dan lokasi direset ke default (bekerja di kantor)";
      
    case '/bantuan':
      return `📋 Daftar Perintah Tersedia:
        /status [status] - Mengubah status saat ini
        /lokasi [lokasi] - Mengubah lokasi saat ini
        /reset - Kembali ke status default
        /bantuan - Menampilkan bantuan ini`;
      
    default:
      return "⚠️ Perintah tidak dikenal. Ketik /bantuan untuk melihat daftar perintah.";
  }
}