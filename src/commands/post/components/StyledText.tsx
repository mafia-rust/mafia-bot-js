import React, { ReactElement } from "react";
import ReactDOMServer from "react-dom/server";
import DUMMY_NAMES from "mafia/src/resources/dummyNames.json"
import translate, { langJson, translateChecked } from "mafia/src/game/lang";
import { getAllRoles } from "mafia/src/game/roleListState.d";
import { Role, getFactionFromRole } from "mafia/src/game/roleState.d";

export type WikiArticleLink = 
    `role/${Role}` | 
    `standard/${StandardArticle}` |
    `generated/${GeneratedArticle}`;

const STANDARD_ARTICLES = 
    [...new Set(Object.keys(langJson).filter(key => key.startsWith("wiki.article.standard.")).map(key => key.split(".")[3]))];

export type StandardArticle = typeof STANDARD_ARTICLES[number];

const GENERATED_ARTICLES = ["role_set", "all_text"] as const;
export type GeneratedArticle = typeof GENERATED_ARTICLES[number];

export const ARTICLES: WikiArticleLink[] = 
    getAllRoles().map(role => `role/${role}`)
    .concat(STANDARD_ARTICLES.map(article => `standard/${article}`))
    .concat(GENERATED_ARTICLES.map(article => `generated/${article}`)) as WikiArticleLink[];


export function getArticleLangKey(page: WikiArticleLink): string {
    const path = page.split('/');


    switch (path[0]) {
        case "role":
            return `role.${path[1]}.name`;
        case "standard":
            return `wiki.article.standard.${path[1]}.title`;
        case "generated":
            return `wiki.article.generated.${path[1]}.title`;
        default:
            console.error("Invalid article type: "+path[0]);
            return "ERROR";
    }
}

export function getArticleTitle(page: WikiArticleLink): string {
    return translate(getArticleLangKey(page));
}

export type TokenData = {
    style?: string, 
    link?: WikiArticleLink,
    replacement?: string
};
type KeywordData = TokenData[];
type KeywordDataMap = { [key: string]: KeywordData };

const MARKDOWN_OPTIONS = {
    breaks: true,
    mangle: false,
    headerIds: false,
    gfm: true
}

type Token = {
    type: "raw"
    string: string 
} | ({
    type: "data"
    string: string
} & KeywordData[number])

/**
 * Styled Text
 * 
 * ***MAKE SURE TO SANITIZE TEXT INPUT INTO THIS ELEMENT*** (If it's from the user)
 * 
 * @see sanitizePlayerMessage in ChatMessage.tsx
 */
export default function StyledText(props: {
        children: string[] | string,
        className?: string,
        noLinks?: boolean,
        markdown?: boolean
    }): ReactElement {

    let tokens: Token[] = [{
        type: "raw",
        string: typeof props.children === "string" 
                ? props.children 
                : props.children.join("")
    }];

    tokens[0].string = tokens[0].string.replace(/\n/g, '<br>');

    tokens = styleKeywords(tokens);

    const jsxString = tokens.map(token => {
        if (token.type === "raw") {
            return token.string;
        } else {
            return ReactDOMServer.renderToStaticMarkup(
                <span
                    className={token.style}
                    dangerouslySetInnerHTML={{ __html: token.string }}
                />
            );
        }
    }).join("");
    
    return <span
        className={props.className}
        dangerouslySetInnerHTML={{__html: jsxString}}>
    </span>
}

const KEYWORD_DATA_MAP: KeywordDataMap = {};

function clearKeywordData() {
    for (const key in KEYWORD_DATA_MAP) {
        delete KEYWORD_DATA_MAP[key];
    }
}

function computeBasicKeywordData() {
    console.log("recomputed keyword data");

    function addTranslatableKeywordData(langKey: string, data: KeywordData) {
        KEYWORD_DATA_MAP[translate(langKey)] = data;
        for (let i = 0, variant; (variant = translateChecked(`${langKey}:var.${i}`)) !== null; i++) {
            const variantData = data.map(datum => ({
                ...datum,
                replacement: datum.replacement === translate(langKey) ? translate(`${langKey}:var.${i}`) : datum.replacement
            }));
            KEYWORD_DATA_MAP[variant] = variantData;
        }
    }

    //add dummy names keywords
    for(let i = 0; i < DUMMY_NAMES.length; i++) {
        const name = DUMMY_NAMES[i];
        KEYWORD_DATA_MAP["sender-"+name] = [
            { style: "keyword-player-number", replacement: (i + 1).toString() },
            { replacement: " " },
            { style: "keyword-player-sender", replacement: name }
        ];
        KEYWORD_DATA_MAP[name] = [
            { style: "keyword-player-number", replacement: (i + 1).toString() },
            { replacement: " " },
            { style: "keyword-player", replacement: name }
        ];
    }

    //add article keywords
    const SortedArticles = [...ARTICLES];
    for (const article of SortedArticles) {
        const keySplit = article.split("/");
        const key = getArticleLangKey(article);

        addTranslatableKeywordData(key, [{
            style: "keyword-info",
            link: `${keySplit[0]}/${keySplit[1]}` as WikiArticleLink,
        }]);
    }

    const KEYWORD_DATA_JSON = require("mafia/src/resources/keywords.json");
    //add role keywords
    for(const role of getAllRoles()){
        const data = KEYWORD_DATA_JSON[getFactionFromRole(role as Role)];
        if (data === undefined || Array.isArray(data)) {
            console.error(`faction.${getFactionFromRole(role as Role)} has malformed keyword data!`);
            continue;
        }

        addTranslatableKeywordData(`role.${role}.name`, [{
            ...data,
            link: `role/${role}` as WikiArticleLink,
            replacement: translate(`role.${role}.name`)   // Capitalize roles
        }]);
    }

    
    //add from keywords.json
    for (const [keyword, data] of Object.entries(KEYWORD_DATA_JSON)) {
        addTranslatableKeywordData(keyword, (Array.isArray(data) ? data : [data]).map(data => {
            return {
                ...data,
                replacement: data.replacement === undefined ? undefined : translate(data.replacement)
            }
        }));
    }
}

function find(text: string): RegExp {
    return RegExp(`(?<!\\w)${regEscape(text)}(?!\\w)`, "gi");
}

function regEscape(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

computeBasicKeywordData();

function styleKeywords(tokens: Token[]): Token[] {
    for(const [keyword, data] of Object.entries(KEYWORD_DATA_MAP).sort((a, b) => b[0].length - a[0].length)){
        for(let index = 0; index < tokens.length; index++) {
            const token = tokens[index];
            if (token.type !== "raw") continue;
            
            const stringSplit = token.string.split(RegExp('('+find(keyword).source+')', 'gi'));

            if (stringSplit.length === 1) continue;

            // Insert the styled string into where we just removed the unstyled string from
            let replacement: Token[] = []; 
            for(const string of stringSplit){
                if(string === "") continue;
                if (!find(keyword).test(string)) {
                    replacement.push({
                        type: "raw",
                        string: string
                    });
                    continue;
                }
                for (const datum of data) {
                    replacement.push({
                        type: "data",
                        string: datum.replacement ?? string,
                        ...datum
                    });
                }
            }

            tokens = 
                tokens.slice(0, index)
                    .concat(replacement)
                    .concat(tokens.slice(index+1));
            
            // Skip elements we've already checked
            index += replacement.length - 1;
        }
    }

    return tokens;
}