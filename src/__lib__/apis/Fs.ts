import * as core from "@actions/core";
import * as fs from "fs-extra";

type Fs = ReturnType<typeof Fs>;

const Fs = () => {
    const api = {
        ...fs,
        writeJson: (path: string, obj: object) => {
            core.debug(`Writing json file "${path}"`);
            const json = JSON.stringify(obj, null, 2);
            core.debug(json);
            return api.writeFile(path, json);
        },
        writeFiles: async (files: {
            [name: string]: (string | Buffer) | object;
        }) => {
            const entries = Object.entries(files);

            for (const [path, content] of entries) {
                if (typeof content === "string" || Buffer.isBuffer(content)) {
                    await api.writeFile(path, content);
                } else if (content && typeof content === "object") {
                    await api.writeJson(path, content);
                } else {
                    throw new Error(
                        `Unable to write file ${path}, content has an invalid type "${typeof content}"`,
                    );
                }
            }
        },
    };

    return api;
};

export default Fs;
