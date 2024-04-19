import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, MessageActionRowComponentBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import nodeHtmlToImage from "node-html-to-image";
import fs from "fs/promises"
import React from "react"
import { renderToString } from "react-dom/server";
import Deck from "./Deck";
import { CONFIG } from "../../config";
import { GameMode } from "mafia/src/game/localStorage";
import parseGameMode, { ParseFailure, isFailure } from "./parse";

const data = new SlashCommandBuilder()
    .setName("post")
    .addStringOption(option => 
        option.setName('deck')
            .setDescription('The deck data')
            .setRequired(true)
    )
    .setDescription("Posts a deck");

async function invoke(interaction: CommandInteraction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const gameModeResult = parseGameMode(interaction.options.getString('deck', true));

    if (isFailure(gameModeResult)) {
        await interaction.reply({ content: `Failed to parse game mode. ${translateParseFailure(gameModeResult)}`, ephemeral: true });
        return;
    }
    const gameMode = gameModeResult.value;

    await interaction.deferReply();

    const html = await renderDeckToHTMLString({ creator: interaction.user.displayName, gameMode: gameMode })

    const imgOutput = `${CONFIG.IMAGES_DIR}/${interaction.id}.png`;
    const jsonOutput = `${CONFIG.JSON_DIR}/${interaction.id}.json`;

    await nodeHtmlToImage({ output: imgOutput, html, transparent: true });
    await fs.writeFile(jsonOutput, JSON.stringify(gameMode, null, 4));
    
    const deleteButton = new ButtonBuilder()
        .setCustomId('delete')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Delete');
    
    const actions = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(deleteButton)
        
    const response = await interaction.editReply({ 
        content: `# ${gameMode.name}\n### By ${interaction.user.displayName}`, 
        files: [{ attachment: imgOutput }, { attachment: jsonOutput } ],
        components: [actions]
    });

    setTimeout(() => {
        fs.rm(imgOutput);
        fs.rm(jsonOutput)
    }, 10000);

    try {
        const confirmation = await response.awaitMessageComponent({ 
            filter: i => i.user.id === interaction.user.id, 
            time: 60_000
        });
        
        if (confirmation.customId === 'delete') {
            await interaction.deleteReply();
        }
    } catch (e) {
        await interaction.editReply({ components: [] });
    }
}

function translateParseFailure(failure: ParseFailure): string {
    switch (failure.reason) {
        case "gameModeNotObject":
            return `This doesn't look like game mode data: '\`${failure.snippet}\`'`
        case "invalidJSON":
            return `This doesn't look like valid JSON: '\`${failure.snippet}\`'`
        case "nameIsNotString":
            return `This game mode name should be a string, instead it was: '\`${failure.snippet}\`'`
        case "roleListIsNotArray":
            return `This role list should be an array, instead it was: '\`${failure.snippet}\`'`
        case "roleOutlineMissingTypeKey":
            return `This role outline is missing the '\`type\`' key: '\`${failure.snippet}\`'`
        case "roleOutlineMissingOptionsKey":
            return `This role outline is missing the '\`options\`' key: '\`${failure.snippet}\`'`
        case "roleOutlineInvalidType":
            return `This role outline has an invalid '\`type\`' value: '\`${failure.snippet}\`'`
        case "roleOutlineOptionListIsNotArray":
            return `This role outline option list should be an array, instead it was: '\`${failure.snippet}\`'`
        case "roleOutlineOptionMissingTypeKey":
            return `This role outline option is missing the '\`type\`' key: '\`${failure.snippet}\`'`
        case "roleOutlineOptionMissingRoleKey":
            return `This role outline option is missing the '\`role\`' key: '\`${failure.snippet}\`'`
        case "roleOutlineOptionMissingRoleSetKey":
            return `This role outline option is missing the '\`roleSet\`' key: '\`${failure.snippet}\`'`
        case "roleOutlineOptionMissingFactionKey":
            return `This role outline option is missing the '\`faction\`' key: '\`${failure.snippet}\'`
        case "roleOutlineOptionInvalidType":
            return `This role outline option has an invalid '\`type\`' value: '\`${failure.snippet}\`'`
        case "disabledRolesIsNotArray":
            return `These disabled roles should be an array, instead they were: '\`${failure.snippet}\`'`
        case "roleIsNotString":
            return `This role should be a string, instead it was: '\`${failure.snippet}\`'`
        case "invalidRole":
            return `This is an invalid role: '\`${failure.snippet}\`'`
        case "roleSetIsNotString":
            return `This role set should be a string, instead it as: '\`${failure.snippet}\`'`
        case "invalidRoleSet":
            return `This is an invalid role set: '\`${failure.snippet}\`'`
        case "factionIsNotString":
            return `This faction should be a string, instead it was: '\`${failure.snippet}\`'`
        case "invalidFaction":
            return `This is an invalid faction: '\`${failure.snippet}\`'`
        default:
            if (failure.reason.endsWith("KeyMissingFromPhaseTimes")) {
                const key = failure.reason.substring(0, failure.reason.indexOf("KeyMissingFromPhaseTimes"))
                return `These phase time settings are missing the '\`${key}\`' key: '\`${failure.snippet}\`'`
            }
            if (failure.reason.endsWith("ValueOfPhaseTimesIsNotNumber")) {
                const key = failure.reason.substring(0, failure.reason.indexOf("ValueOfPhaseTimesIsNotNumber"))
                return `These phase time settings have an invalid '\`${key}\`' value: '\`${failure.snippet}\`'`
            }
            if (failure.reason.endsWith("KeyMissingFromGameMode")) {
                const key = failure.reason.substring(0, failure.reason.indexOf("KeyMissingFromGameMode"))
                return `This game mode is missing the '\`${key}\`' key: '\`${failure.snippet}\`'`
            }
    }
    return "";
}

async function renderDeckToHTMLString(data: { creator: string, gameMode: GameMode }): Promise<string> {
    let html = await fs.readFile("./src/commands/post/base.html", { encoding: "utf8" });

    let styleSheets = "";
    for (const fileName of [
        '../mafia/client/src/components/selectorSection.css',
        '../mafia/client/src/components/disabledRoleSelector.css',
        '../mafia/client/src/components/outlineSelector.css',
        '../mafia/client/src/components/phaseTimeSelector.css',
        '../mafia/client/src/menu/lobby/lobbyMenu.css',
        '../mafia/client/src/components/styledText.css',
        '../mafia/client/src/index.css',
        './src/commands/post/deck.css',
    ]) {
        const css = await fs.readFile(fileName, { encoding: "utf8" });
        styleSheets += `<style>${css}</style>`;
    }

    html = html.replace('$style', styleSheets);

    html = html.replace('$deck', renderToString(
        <React.StrictMode>
            <Deck {...data} />
        </React.StrictMode>,
    ));

    return html;
}

const post: Command = { data, invoke }

export default post;
