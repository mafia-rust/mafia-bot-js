import { CommandInteraction, InteractionResponse, SlashCommandBuilder } from "discord.js";
import { Command } from ".";

const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!");

async function invoke(interaction: CommandInteraction): Promise<void> {
    interaction.reply("Pong!");
    return;
}

const ping: Command = { data, invoke }

export default ping;