import {
    addScriptsToPackageJson,
    Git,
    installDevDependencies,
    runNpmScript,
    writeFiles,
} from "./helpers";
import { Inputs } from "./inputs";

const paths = {
    config: ".prettierrc.json",
    ignore: ".prettierignore",
};

const apply = async ({ config, ignore, extensions, githubToken }: Inputs) => {
    const git = Git(githubToken);
    const extensionGlobs = extensions
        .map(ext => ext.replace(/\s+/g, ""))
        .map(ext => `'**/*.${ext}'`);

    await installDevDependencies(["prettier"]);
    await addScriptsToPackageJson({
        format: `prettier --write ${extensionGlobs.join(" ")}`,
        "format-check": `prettier --check ${extensionGlobs.join(" ")}`,
    });
    await writeFiles({
        [paths.config]: config,
        [paths.ignore]: ignore,
    });
    await git
        .add(".")
        .commit("Add prettier")
        .push()
        .execute();

    await runNpmScript("format");

    await git
        .add(".")
        .commit("Format code using prettier")
        .push()
        .execute();
};

export default apply;
