import { exec, ExecOptions } from "child_process";
import execa from "execa";

//noinspection JSUnusedGlobalSymbols
type ChildProcess = ReturnType<typeof ChildProcess>;

const ChildProcess = () => {
    //noinspection UnnecessaryLocalVariableJS
    const api = {
        exec: (command: string, options: ExecOptions = {}) =>
            new Promise<string>((resolve, reject) =>
                exec(command, options, (err, stdout, stderr) =>
                    err || stderr
                        ? reject(err || new Error(stderr))
                        : resolve(stdout),
                ),
            ),
        execa,
    };

    return api;
};

export default ChildProcess;
