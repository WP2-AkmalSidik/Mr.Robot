import { Message } from "whatsapp-web.js";

abstract class Command {
    prefixs: string[] = ['/', '.', '!', '~'];
    name: string;
    description: string;
    alias: string[];
    requiresPrefix: boolean;

    constructor(name: string, description?: string, alias?: string[], requiresPrefix = true) {
        this.name = name;
        this.description = description || '';
        this.alias = alias ? [name, ...alias] : [name];
        this.requiresPrefix = requiresPrefix; // Default: true (butuh prefix)
    }

    abstract execute(msg: Message, args: string[]): void;

    handle(msg: Message) {
        const prefix = msg.body[0];
        const argAll: string[] = msg.body.slice(1).split(" "); // Semua pesan tanpa prefix

        if (this.requiresPrefix && this.prefixs.includes(prefix)) {
            const cmdNoPrefix = argAll[0].toLocaleLowerCase();
            if (this.alias.includes(cmdNoPrefix)) {
                const args = argAll.slice(1); // Semua teks tanpa command
                this.execute(msg, args);
            }
        } else if (!this.requiresPrefix) {
            this.execute(msg, []);
        }
    }
}

export default Command;
