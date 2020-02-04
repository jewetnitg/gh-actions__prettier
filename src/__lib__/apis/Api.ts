import ChildProcess from "./ChildProcess";
import Fs from "./Fs";
import Git from "./Git";
import Npm from "./Npm";

//noinspection JSUnusedGlobalSymbols
type Api = ReturnType<typeof Api>;

export interface ApiOptions {
    git?: {
        token?: string;
        user?: string;
        email?: string;
        branch?: string;
        repository?: string;
    };
    defaultJsonIndent?: string | number;
}

const Api = ({
    git: {
        token = process.env.GITHUB_TOKEN || "",
        user = process.env.GITHUB_ACTOR || "",
        email = "action@github.com",
        branch = "develop",
        repository = process.env.GITHUB_REPOSITORY || "",
    } = {},
    defaultJsonIndent = 2,
}: ApiOptions = {}) => {
    const api = {
        fs: Fs({ defaultJsonIndent }),
        npm: Npm({ defaultJsonIndent }),
        childProcess: ChildProcess(),
        git: Git({ token, user, email, branch, repository }),
        githubToken: token,
    };

    return api;
};

export default Api;
