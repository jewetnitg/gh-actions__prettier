import execa from "execa";
import { readJson, writeFile } from "fs-extra";

type Npm = ReturnType<typeof Npm>;

interface InstallOptions {
    bundle?: boolean;
    exact?: boolean;
    type?: "prod" | "dev" | "optional";
}

const paths = {
    packageJson: "package.json",
};

const Npm = () => {
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
                add: async (scripts: { [name: string]: string }) =>
                    npm.packageJson.transform(pkg => ({
                        ...pkg,
                        scripts: {
                            ...(pkg.scripts || {}),
                            ...scripts,
                        },
                    })),
            },
            transform: async (
                transformer: (pkg: {
                    [name: string]: any;
                }) =>
                    | Promise<{ [name: string]: any } | void>
                    | { [name: string]: any }
                    | void,
            ) => {
                const pkg = await readJson(paths.packageJson);

                await writeFile(
                    paths.packageJson,
                    JSON.stringify((await transformer(pkg)) || pkg, null, 4),
                );
            },
        },
        run: async (scriptName: string, args: string[] = []) => {
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
