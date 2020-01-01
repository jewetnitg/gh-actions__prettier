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

        execSync(`npm install -D prettier`, {
            env: process.env,
        });
        writeFileSync(paths.config, config);
        writeFileSync(paths.ignore, ignore);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
