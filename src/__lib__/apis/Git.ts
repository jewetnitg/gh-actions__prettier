import config from "../../config";
import ChildProcess from "./ChildProcess";

type Git = ReturnType<typeof Git>;

const Git = (githubToken: string) => {
    const { execa, exec } = ChildProcess();
    let commands: [string, string[]][] = [];
    let shouldExecute = false;
    const initialGitCommands = async (): Promise<[string, string[]][]> =>
        [
            ["git", ["config", "--local", "user.name", config.git.user.name]],
            ["git", ["config", "--local", "user.email", config.git.user.email]],
            [
                "git",
                [
                    "checkout",
                    !(await git.hasBranch(config.git.branch)) && "-b",
                    config.git.branch,
                ].filter(Boolean),
            ],
        ].filter(Boolean) as [string, string[]][];

    const git = {
        getBranches: async () =>
            (await exec(`git branch | tail`))
                .split("\n")
                .map(v => v.replace("*", "").replace(/\s+/g, "")),
        hasBranch: async (branch: string) =>
            (await git.getBranches()).includes(branch),
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
            const remoteUrl = config.git.remote.url(githubToken);

            if (shouldExecute) {
                throw new Error(`Execute before performing another git action`);
            }

            commands.push([
                "git",
                ["push", "-u", remoteUrl, config.git.branch, ...flags],
            ]);

            shouldExecute = true;

            return git;
        },
        execute: async () => {
            for (const [command, args] of [
                ...(await initialGitCommands()),
                ...commands,
            ]) {
                await execa(command, args);
            }

            shouldExecute = false;

            commands = await initialGitCommands();
        },
    };

    return git;
};

export default Git;
