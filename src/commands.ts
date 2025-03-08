import Command from "./commands/Command";
import { CommandAutoReply } from "./commands/CommandAutoReply";
import { CommandMenu } from "./commands/CommandMenu";

const commands: Command[] = [
    new CommandMenu(),
    new CommandAutoReply() // Ditambahkan ke daftar perintah
];

export default commands;
