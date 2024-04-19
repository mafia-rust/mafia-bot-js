import { CommandInteraction, InteractionResponse, SlashCommandBuilder } from "discord.js";
import ping from "./ping";
import post from "./post";

export type Command = {
    data: SlashCommandBuilder,
    invoke: (interaction: CommandInteraction) => Promise<void>;
}

export const COMMANDS = [ ping, post ];