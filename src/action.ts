import { Options } from "prettier";
import { ActionBuilder } from "./__lib__";
import { object, string, stringarray } from "./__lib__/InputParsers";

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
    .step("chore: add prettier", async ({ npm, fs }, inputs) => {
        const { ignore, config, extensionGlobs } = inputs;

        await npm.install.dev(["prettier"]);

        await fs.writeFiles({
            [paths.config]: config,
            [paths.ignore]: ignore,
        });

        await npm.packageJson.scripts.add({
            format: `prettier --write ${extensionGlobs.join(" ")}`,
            "format-check": `prettier --check ${extensionGlobs.join(" ")}`,
        });
    })
    .step("chore: format code using prettier", ({ npm }) => npm.run("format"))
    .build();

export default action;
