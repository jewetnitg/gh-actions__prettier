import execa from "execa";
import config from "../../config";

const initialGitCommands = async (
    githubToken: string,
): Promise<[string, string[]][]> => {
    const remoteUrl = config.git.remote.url(githubToken);
    const { stdout } = await execa("git", ["remote"]);
    const hasRemote = stdout.split("\n").includes(config.git.remote.name);

    return [
        !hasRemote && [
            "git",
            ["remote", "add", config.git.remote.name, remoteUrl],
        ],
        ["git", ["config", "--local", "user.name", config.git.user.name]],
        ["git", ["config", "--local", "user.email", config.git.user.email]],
        ["git", ["checkout", "-b", config.git.branch]],
    ].filter(Boolean) as [string, string[]][];
};

type Git = ReturnType<typeof Git>;

const Git = (githubToken: string) => {
    let commands: [string, string[]][] = [];
    let shouldExecute = false;

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

            commands.push(["git", ["commit", "-m", message]]);

            return git;
        },
        push: (flags: string[] = []) => {
            if (shouldExecute) {
                throw new Error(`Execute before performing another git action`);
            }

            commands.push(["git", ["push", config.git.branch, ...flags]]);

            shouldExecute = true;

            return git;
        },
        execute: async () => {
            for (const [command, args] of [
                ...(await initialGitCommands(githubToken)),
                ...commands,
            ]) {
                await execa(command, args);
            }

            shouldExecute = false;

            commands = await initialGitCommands(githubToken);
        },
    };

    return git;
};

export default Git;
