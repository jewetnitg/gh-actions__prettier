import * as core from "@actions/core";
import { execSync } from "child_process";
import { writeFileSync } from "fs";

const paths = {
    config: ".prettierrc.json",
    ignore: ".prettierignore",
};

async function run(): Promise<void> {
    try {
        const config = core.getInput("config");
        const ignore = core.getInput("ignore");
        const extensions = core
            .getInput("extensions")
            .split("\n")
            .filter(Boolean);

        const extensionGlobs = extensions.map(ext => `'**/*.${ext}'`).join(" ");

        const json = JSON.stringify({
            format: `prettier --write ${extensionGlobs}`,
            "format-check": `prettier --check ${extensionGlobs}`,
        });

        execSync(`npm install -D prettier`, { env: process.env });
        execSync(`jq '.scripts += ${json}' package.json | tee package.json`, {
            env: process.env,
        });

        writeFileSync(paths.config, config);
        writeFileSync(paths.ignore, ignore);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
