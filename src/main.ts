import * as core from "@actions/core";
import apply from "./apply";
import { getInputs } from "./inputs";

async function run(): Promise<void> {
    try {
        await apply(getInputs());
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
