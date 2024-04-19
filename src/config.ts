import dotenv from "dotenv";

dotenv.config();

function getEnvironmentVariables<K extends string[]>(...vars: K): Record<K[number], any> {
    const environment = process.env;
    return vars.reduce(
        (acc, variable: K[number]) => {
            if (Object.keys(environment).includes(variable)) {
                return {
                    ...acc, 
                    [variable]: environment[variable]
                };
            } else {
                throw new Error(`Missing environment variable ${variable}`)
            }
        },
        {} as Partial<Record<K[number], any>>
    ) as Record<K[number], any>
}

export const CONFIG = getEnvironmentVariables(
    "DISCORD_TOKEN",
    "DISCORD_CLIENT_ID",
    "IMAGES_DIR"
);
