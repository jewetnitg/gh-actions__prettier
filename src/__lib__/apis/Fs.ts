import * as core from "@actions/core";
import * as fs from "fs-extra";

//noinspection JSUnusedGlobalSymbols
type Fs = ReturnType<typeof Fs>;

export type JsonValue = object | string | number | boolean | null;

export interface FsOptions {
    defaultJsonIndent: string | number;
}

const Fs = ({ defaultJsonIndent }: FsOptions) => {
    const api = {
        ...fs,
        detectJsonIndent: async (path: string) => {
            const textContent = (await api.readFile(path)).toString();

            try {
                JSON.parse(textContent);
            } catch (err) {
                throw new Error(
                    `Unable to detect json indent, provided string is not valid JSON`,
                );
            }

            const indeterminableValues = ["{}", "[]", "null", "true", "false"];

            if (
                indeterminableValues.includes(textContent) ||
                // is a string
                textContent.startsWith(`"`) ||
                // is a number
                textContent.match(/^\d+$/g)
            ) {
                return null;
            }

            const lines = textContent
                .split("\n")
                // remove empty lines
                .filter(line => line && !line.match(/^\s+$/g));

            if (lines.length < 3) {
                return null;
            }

            // find a "regular" line
            const line = lines.find(line => line.match(/^\s+"/g));

            if (!line) {
                return null;
            }

            return line.slice(0, line.indexOf(`"`));
        },
        writeJson: async (path: string, content: JsonValue) => {
            const indent = (await api.pathExists(path))
                ? (await api.detectJsonIndent(path)) || defaultJsonIndent
                : defaultJsonIndent;

            core.info(`Writing json file "${path}"`);
            const json = JSON.stringify(content, null, indent);
            core.info(json);
            return api.writeFile(path, json);
        },
        writeFiles: async (files: {
            [name: string]: (string | Buffer) | JsonValue;
        }) => {
            const entries = Object.entries(files);

            for (const [path, content] of entries) {
                if (typeof content === "string" || Buffer.isBuffer(content)) {
                    await api.writeFile(path, content);
                } else if (typeof content === "object") {
                    await api.writeJson(path, content);
                } else {
                    throw new Error(
                        `Unable to write file ${path}, ` +
                            `content has an invalid type "${typeof content}"`,
                    );
                }
            }
        },
    };

    return api;
};

export default Fs;
