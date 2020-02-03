import * as core from "@actions/core";
import Fs from "./apis/Fs";
import Git from "./apis/Git";
import Npm from "./apis/Npm";

export interface Api {
    fs: Fs;
    npm: Npm;
    git: Git;
    githubToken: string;
}

export type InputDeserializer<TDeserialized> = (input: string) => TDeserialized;

export type StepFn<TInputs extends DefaultInputs> = (
    api: Api,
    inputs: TInputs,
) => Promise<void>;

export interface DefaultInputs {
    [name: string]: any;
    githubToken: string;
}

export const ActionBuilder = <TInputs extends DefaultInputs>() => {
    const steps: [string, StepFn<TInputs>][] = [];
    const inputDeserializers: [
        keyof TInputs,
        InputDeserializer<TInputs[keyof TInputs]>,
    ][] = [
        //@ts-ignore
        ["githubToken", String],
    ];
    const syntheticInputDeserializers: [
        keyof TInputs,
        (inputs: Partial<TInputs>) => TInputs[keyof TInputs],
    ][] = [];

    const getInputs = () =>
        syntheticInputDeserializers.reduce(
            (inputs, [key, deserialize]) => ({
                ...inputs,
                [key]: deserialize(inputs),
            }),
            inputDeserializers.reduce(
                (inputs, [key, deserialize]) => ({
                    ...inputs,
                    [key]: deserialize(core.getInput(key as string)),
                }),
                {} as TInputs,
            ),
        );

    const builder = {
        input: <TName extends keyof TInputs>(
            name: TName,
            deserializer: InputDeserializer<TInputs[TName]>,
        ) => {
            inputDeserializers.push([name, deserializer]);
            return builder;
        },
        syntheticInput: <TName extends keyof TInputs>(
            name: TName,
            deserializer: (inputs: Partial<TInputs>) => TInputs[TName],
        ) => {
            syntheticInputDeserializers.push([name, deserializer]);
            return builder;
        },
        step: (message: string, fn: StepFn<TInputs>) => {
            steps.push([message, fn]);
            return builder;
        },
        build: () => Action(core.getInput("githubToken"), steps, getInputs),
    };

    return builder;
};

const Action = <TInputs extends DefaultInputs>(
    githubToken: any,
    steps: [string, StepFn<TInputs>][],
    getInputs: () => TInputs,
) => ({
    run: async () => {
        try {
            const git = Git(githubToken);

            for (const [message, fn] of steps) {
                try {
                    await core.group(message, async () => {
                        const api: Api = {
                            fs: Fs(),
                            npm: Npm(),
                            git,
                            githubToken,
                        };
                        await fn(api, getInputs());
                        await git
                            .add(".")
                            .commit(message)
                            .execute();
                    });
                } catch (e) {
                    core.setFailed(e.message);
                    return;
                }
            }

            await git.push().execute();
        } catch (e) {
            core.setFailed(e.message);
        }
    },
});
