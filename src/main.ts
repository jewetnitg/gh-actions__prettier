import * as core from "@actions/core";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

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
        const { tabWidth = 2 } = JSON.parse(config);

        const extensionGlobs = extensions
            .map(ext => `'**/*.${ext.replace(/\s+/g, "")}'`)
            .join(" ");

        execSync(`npm install -D prettier`, { env: process.env });

        const pkg = JSON.parse(readFileSync("package.json").toString());
        pkg.scripts = {
            ...pkg.scripts,
            format: `prettier --write ${extensionGlobs}`,
            "format-check": `prettier --check ${extensionGlobs}`,
        };

        writeFileSync("package.json", JSON.stringify(pkg, null, tabWidth));

        writeFileSync(paths.config, config);
        writeFileSync(paths.ignore, ignore);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
