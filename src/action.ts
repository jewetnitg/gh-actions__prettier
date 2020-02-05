import {
    ActionBuilder,
    object,
    string,
    stringarray,
} from "@gh-actions/helpers";
import { Options } from "prettier";

const paths = {
    config: ".prettierrc.json",
    ignore: ".prettierignore",
};

interface Inputs {
    config: Options;
    extensions: string[];
    extensionGlobs: string[];
    ignore: string;
}

const action = ActionBuilder<Inputs>()
    .input("ignore", string())
    .input("config", object({ tabWidth: 2 }))
    .input("extensions", stringarray())
    .syntheticInput("extensionGlobs", ({ extensions = [] }) =>
        extensions
            .map(ext => ext.replace(/\s+/g, ""))
            .map(ext => `'**/*.${ext}'`),
    )
    .step("chore: add prettier", async ({ npm, writeFiles }, inputs) => {
        const { ignore, config, extensionGlobs } = inputs;

        await npm.install.dev(["prettier"]);

        await writeFiles({
            [paths.config]: config,
            [paths.ignore]: ignore,
        });

        await npm.packageJson.scripts.add({
            format: `prettier --write ${extensionGlobs.join(" ")}`,
            "format-check": `prettier --check ${extensionGlobs.join(" ")}`,
        });
    })
    .step("chore: format code using prettier", async ({ npm }) =>
        npm.run("format"),
    )
    .build();

export default action;
