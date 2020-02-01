import * as core from "@actions/core";
import { Options } from "prettier";

export interface Inputs {
    config: Options;
    ignore: string;
    extensions: string[];
    extensionGlobs: string[];
}

export const getInputs = (): Inputs => {
    const extensions = core
        .getInput("extensions")
        .split("\n")
        .filter(Boolean);

    return {
        ignore: core.getInput("ignore"),
        extensions: extensions,
        extensionGlobs: extensions
            .map(ext => ext.replace(/\s+/g, ""))
            .map(ext => `'**/*.${ext}'`),
        config: {
            tabWidth: 2,
            ...JSON.parse(core.getInput("config")),
        },
    };
};
