import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands"
import { COMMANDS } from "./commands"
import { CONFIG } from "./config";

const CLIENT = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

CLIENT.once("ready", () => {
    console.log("Ready.");
    for (const guild of CLIENT.guilds.cache) {
        deployCommands({ guildId: guild[1].id });
    }
});

CLIENT.on("guildCreate", async (guild) => {
    await deployCommands({ guildId: guild.id });
});

CLIENT.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    COMMANDS.find(command => command.data.name === interaction.commandName)?.invoke(interaction)
});

CLIENT.login(CONFIG.DISCORD_TOKEN);