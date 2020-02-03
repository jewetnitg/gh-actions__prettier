import execa from "execa";
import config from "../../config";

const initialGitCommands = (githubToken: string): [string, string[]][] => {
    const remoteUrl = config.git.remote.url(githubToken);
    return [
        ["git", ["remote", "add", config.git.remote.name, remoteUrl]],
        ["git", ["config", "--local", "user.name", config.git.user.name]],
        ["git", ["config", "--local", "user.email", config.git.user.email]],
        ["git", ["checkout", "-b", config.git.branch]],
    ];
};

type Git = ReturnType<typeof Git>;

const Git = (githubToken: string) => {
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
            for (const [command, args] of commands) {
                await execa(command, args);
            }

            shouldExecute = false;

            commands = initialGitCommands(githubToken);
        },
    };

    return git;
};

export default Git;
