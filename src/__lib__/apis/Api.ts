import ChildProcess from "./ChildProcess";
import Fs from "./Fs";
import Git from "./Git";
import Npm from "./Npm";

interface Api {
    fs: Fs;
    childProcess: ChildProcess;
    npm: Npm;
    git: Git;
    githubToken: string;
}

const Api = (githubToken: string) => {
    const api: Api = {
        fs: Fs(),
        npm: Npm(),
        childProcess: ChildProcess(),
        git: Git(githubToken),
        githubToken,
    };

    return api;
};

export default Api;
