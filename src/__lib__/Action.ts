import * as core from "@actions/core";
import Api from "./apis";
import { ApiOptions } from "./apis/Api";

export type StepFn<TInputs> = (api: Api, inputs: TInputs) => Promise<void>;
const Action = <TInputs>(
    steps: [string, StepFn<TInputs>][],
    getInputs: () => TInputs,
) => ({
    run: async (options: ApiOptions = {}) => {
        try {
            const api = Api(options);

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
