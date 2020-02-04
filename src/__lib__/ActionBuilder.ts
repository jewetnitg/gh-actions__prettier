import * as core from "@actions/core";
import Action, { StepFn } from "./Action";

export type InputDeserializer<TDeserialized> = (input: string) => TDeserialized;

const ActionBuilder = <TInputs>() => {
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
        build: () => Action(steps, getInputs),
    };

    return builder;
};

export default ActionBuilder;
