import * as core from "@actions/core";
import ChildProcess from "./ChildProcess";
import Fs from "./Fs";

//noinspection JSUnusedGlobalSymbols
type Npm = ReturnType<typeof Npm>;

interface InstallOptions {
    bundle?: boolean;
    exact?: boolean;
    type?: "prod" | "dev" | "optional";
}

const paths = {
    packageJson: "package.json",
};

export interface NpmOptions {
    defaultJsonIndent: string | number;
}

const Npm = ({ defaultJsonIndent }: NpmOptions) => {
    const { execa } = ChildProcess();
    const { writeJson, readJson } = Fs({ defaultJsonIndent });
    const npm = {
        install: Object.assign(
            async (
                dependencies: string[] = [],
                {
                    bundle = false,
                    exact = false,
                    type = "prod",
                }: InstallOptions = {},
            ) => {
                const flags = dependencies.length
                    ? ([
                          `--save-${type}`,
                          bundle && "--save-bundle",
                          exact && "--save-exact",
                      ].filter(Boolean) as string[])
                    : [];

                if (dependencies.length) {
                    core.info(
                        `Adding ${type} dependencies: ${dependencies.join(
                            ", ",
                        )}`,
                    );
                }

                await execa(`npm`, [`install`, ...flags, ...dependencies], {
                    env: process.env,
                });
            },
            {
                dev: (
                    dependencies: string[] = [],
                    options: InstallOptions = {},
                ) => npm.install(dependencies, { ...options, type: "dev" }),
            },
        ),
        packageJson: {
            scripts: {
                add: async (scripts: { [name: string]: string }) => {
                    const keys = Object.keys(scripts).join(", ");

                    if (!keys.length) {
                        return;
                    }

                    core.info(`Adding ${keys} scripts to package.json`);

                    return npm.packageJson.transform(pkg => ({
                        ...pkg,
                        scripts: {
                            ...(pkg.scripts || {}),
                            ...scripts,
                        },
                    }));
                },
            },
            transform: async (
                transformer: (pkg: {
                    [name: string]: any;
                }) =>
                    | Promise<{ [name: string]: any } | void>
                    | ({ [name: string]: any } | void),
            ) => {
                const pkg = await readJson(paths.packageJson);
                const transformedPkg = (await transformer(pkg)) || pkg;

                await writeJson(paths.packageJson, transformedPkg);
            },
        },
        run: async (scriptName: string, args: string[] = []) => {
            core.info(`Running npm script "${scriptName}"`);

            if (args.length) {
                core.info(`Script arguments: ${args.join(", ")}"`);
            }

            await execa("npm", [
                "run",
                scriptName,
                ...(args.length ? ["--", ...args] : []),
            ]);
        },
    };

    return npm;
};

export default Npm;
