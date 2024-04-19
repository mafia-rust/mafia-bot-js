import { REST, Routes } from "discord.js";
import { CONFIG } from "./config";
import { COMMANDS } from "./commands";

const COMMAND_DATA = COMMANDS.map((command) => command.data);

const API = new REST({ version: "10" }).setToken(CONFIG.DISCORD_TOKEN);

type DeployCommandsProps = {
    guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
    try {
        console.log("Started refreshing application (/) commands.");

        await API.put(
            Routes.applicationGuildCommands(CONFIG.DISCORD_CLIENT_ID, guildId),
            {
                body: COMMAND_DATA,
            }
        );

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}