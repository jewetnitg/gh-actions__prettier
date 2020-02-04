import * as core from "@actions/core";
import Api from "./apis";
import { DefaultInputs } from "./DefaultInputs";

export type StepFn<TInputs extends DefaultInputs> = (
    api: Api,
    inputs: TInputs,
) => Promise<void>;
const Action = <TInputs extends DefaultInputs>(
    githubToken: any,
    steps: [string, StepFn<TInputs>][],
    getInputs: () => TInputs,
) => ({
    run: async () => {
        try {
            const api = Api(githubToken);

            for (const [message, fn] of steps) {
                try {
                    await core.group(message, async () => {
                        await fn(api, getInputs());
                        await api.git
                            .add(".")
                            .commit(message)
                            .execute();
                    });
                } catch (e) {
                    core.setFailed(e.message);
                    return;
                }
            }

            await api.git.push().execute();
        } catch (e) {
            core.setFailed(e.message);
        }
    },
});

export default Action;
