import { Options } from "prettier";
import { ActionBuilder, DefaultInputs } from "./__lib__";

const paths = {
    config: ".prettierrc.json",
    ignore: ".prettierignore",
};

interface Inputs extends DefaultInputs {
    config: Options;
    extensions: string[];
    extensionGlobs: string[];
    ignore: string;
}

const action = ActionBuilder<Inputs>()
    .input("ignore", String)
    .input("config", json => ({ tabWidth: 2, ...JSON.parse(json) }))
    .input("extensions", str => str.split("\n").filter(Boolean))
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
