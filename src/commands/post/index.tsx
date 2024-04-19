import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import nodeHtmlToImage from "node-html-to-image";
import fs from "fs/promises"
import React, { createElement } from "react"
import ReactDOM from "react-dom"
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

    await interaction.deferReply();

    const gameMode = parseGameMode(interaction.options.getString('deck', true));

    if (isFailure(gameMode)) {
        interaction.editReply({ content: `Failed to parse game mode. ${translateParseFailure(gameMode)}` });
        return;
    }

    const html = await renderDeckToHTMLString({ creator: interaction.user.displayName, gameMode: gameMode.value })
    const output = `${CONFIG.IMAGES_DIR}/${interaction.id}.png`;

    await nodeHtmlToImage({ output, html });

    console.log('The image was created successfully!')
        
    interaction.editReply({ files: [{ attachment: output }] });
}

function translateParseFailure(failure: ParseFailure): string {
    switch (failure.reason) {
        case "gameModeNotObject":
            return `This doesn't look like game mode data: ${failure.snippet}`
        case "invalidJSON":
            return `This doesn't look like valid JSON: ${failure.snippet}`
        case "nameIsNotString":
            return `The game mode name should be a string, instead it was: ${failure.snippet}`
        case "roleListIsNotArray":
            return `The role list should be an array, instead it was: ${failure.snippet}`
        case "roleOutlineMissingTypeKey":
            return `This role outline is missing the 'type' key: ${failure.snippet}`
        case "roleOutlineMissingOptionsKey":
            return `This role outline is missing the 'options' key: ${failure.snippet}`
        case "roleOutlineInvalidType":
            return `This role outline has an invalid 'type' value: ${failure.snippet}`
        case "roleOutlineOptionListIsNotArray":
            return `The role outline option list should be an array, instead it was: ${failure.snippet}`
        case "roleOutlineOptionMissingTypeKey":
            return `This role outline option is missing the 'type' key: ${failure.snippet}`
        case "roleOutlineOptionMissingRoleKey":
            return `This role outline option is missing the 'role' key: ${failure.snippet}`
        case "roleOutlineOptionMissingRoleSetKey":
            return `This role outline option is missing the 'roleSet' key: ${failure.snippet}`
        case "roleOutlineOptionMissingFactionKey":
            return `This role outline option is missing the 'faction' key: ${failure.snippet}`
        case "roleOutlineOptionInvalidType":
            return `This role outline option has an invalid 'type' value: ${failure.snippet}`
        case "disabledRolesIsNotArray":
            return `The disabled roles should be an array, instead it was: ${failure.snippet}`
        case "roleIsNotString":
            return `This role should be a string, instead it was: ${failure.snippet}`
        case "invalidRole":
            return `This is an invalid role: ${failure.snippet}`
        case "roleSetIsNotString":
            return `This role set should be a string, instead it as: ${failure.snippet}`
        case "invalidRoleSet":
            return `This is an invalid role set: ${failure.snippet}`
        case "factionIsNotString":
            return `This faction should be a string, instead it was: ${failure.snippet}`
        case "invalidFaction":
            return `This is an invalid faction: ${failure.snippet}`
        default:
            if (failure.reason.endsWith("KeyMissingFromPhaseTimes")) {
                const key = failure.reason.substring(0, failure.reason.indexOf("KeyMissingFromPhaseTimes"))
                return `These phase time settings are missing the ${key} key: ${failure.snippet}`
            }
            if (failure.reason.endsWith("ValueOfPhaseTimesIsNotNumber")) {
                const key = failure.reason.substring(0, failure.reason.indexOf("ValueOfPhaseTimesIsNotNumber"))
                return `These phase time settings have an invalid ${key} value: ${failure.snippet}`
            }
            if (failure.reason.endsWith("KeyMissingFromGameMode")) {
                const key = failure.reason.substring(0, failure.reason.indexOf("KeyMissingFromGameMode"))
                return `The game mode is missing the ${key} key: ${failure.snippet}`
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
        './src/commands/post/styles/deck.css',
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
