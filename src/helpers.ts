import execa from "execa";
import { readJson, writeFile } from "fs-extra";

const paths = {
    packageJson: "package.json",
};

export const installDependencies = async (
    dependencies: string[],
    dev = false,
) => {
    if (!dependencies.length) {
        return;
    }

    await execa(`npm`, [`install`, ...(dev ? ["-D"] : []), ...dependencies], {
        env: process.env,
    });
};

export const writeJson = (path: string, obj: object) =>
    writeFile(path, JSON.stringify(obj, null, 4));

export const writeFiles = async (files: {
    [name: string]: string | object;
}) => {
    const entries = Object.entries(files);
    for (const [path, content] of entries) {
        if (typeof content === "string") {
            await writeFile(path, content);
        } else if (content && typeof content === "object") {
            await writeJson(path, content);
        } else {
            throw new Error(
                `Unable to write file ${path}, content has an invalid type "${typeof content}"`,
            );
        }
    }
};

export const installDevDependencies = (dependencies: string[]) =>
    installDependencies(dependencies, true);

export const transformPackageJson = async (
    transformer: (pkg: {
        [name: string]: any;
    }) =>
        | Promise<{ [name: string]: any } | void>
        | { [name: string]: any }
        | void,
) => {
    const pkg = await readJson(paths.packageJson);

    await writeFile(
        paths.packageJson,
        JSON.stringify((await transformer(pkg)) || pkg, null, 4),
    );
};

export const addScriptsToPackageJson = async (scripts: {
    [name: string]: string;
}) =>
    transformPackageJson(pkg => ({
        ...pkg,
        scripts: {
            ...(pkg.scripts || {}),
            ...scripts,
        },
    }));

const { GITHUB_REPOSITORY, GITHUB_ACTOR } = process.env;

const GIT_REMOTE_NAME = "github";
const GIT_BRANCH = "develop";
const GIT_USER_NAME = "GitHub Action";
const GIT_USER_EMAIL = "action@github.com";

export const runNpmScript = async (scriptName: string, args: string[] = []) => {
    await execa("npm", [
        "run",
        scriptName,
        ...(args.length ? ["--", ...args] : []),
    ]);
};

const initialGitCommands = (githubToken: string): [string, string[]][] => {
    const remoteUrl = `https://${GITHUB_ACTOR}:${githubToken}@github.com/${GITHUB_REPOSITORY}.git`;
    return [
        ["git", ["remote", "add", GIT_REMOTE_NAME, remoteUrl]],
        ["git", ["config", "--local", "user.name", GIT_USER_NAME]],
        ["git", ["config", "--local", "user.email", GIT_USER_EMAIL]],
        ["git", ["checkout", "-b", GIT_BRANCH]],
    ];
};

export const Git = (githubToken: string) => {
    let shouldExecute = false;
    let commands = initialGitCommands(githubToken);

    const git = {
        add: (files: string[] | string = ["."]) => {
            if (shouldExecute) {
                throw new Error(`Execute before performing another git action`);
            }

            commands.push([
                "git",
                [
                    "add",
                    ...(Array.isArray(files) ? files : [files]).filter(Boolean),
                ],
            ]);

            return git;
        },
        commit: (message: string) => {
            if (shouldExecute) {
                throw new Error(`Execute before performing another git action`);
            }

            commands.push(["git", ["commit", "-am", message]]);

            return git;
        },
        push: (flags: string[] = []) => {
            if (shouldExecute) {
                throw new Error(`Execute before performing another git action`);
            }

            commands.push(["git", ["push", GIT_BRANCH, ...flags]]);

            shouldExecute = true;

            return git;
        },
        execute: async () => {
            for (const [command, args] of commands) {
                await execa(command, args);
            }

            shouldExecute = false;

            commands = initialGitCommands(githubToken);
        },
    };

    return git;
};
