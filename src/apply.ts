import {
    addScriptsToPackageJson,
    installDevDependencies,
    writeFiles,
} from "./helpers";
import { Inputs } from "./inputs";

const paths = {
    config: ".prettierrc.json",
    ignore: ".prettierignore",
    packageJson: "package.json",
};

const apply = async ({ config, ignore, extensionGlobs }: Inputs) => {
    await installDevDependencies(["prettier"]);
    await addScriptsToPackageJson({
        format: `prettier --write ${extensionGlobs.join(" ")}`,
        "format-check": `prettier --check ${extensionGlobs.join(" ")}`,
    });
    await writeFiles({
        [paths.config]: config,
        [paths.ignore]: ignore,
    });
};

export default apply;
