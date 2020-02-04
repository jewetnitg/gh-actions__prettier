const { GITHUB_REPOSITORY, GITHUB_ACTOR } = process.env;

const config = {
    json: {
        indent: "  ",
    },
    git: {
        branch: "develop",
        user: {
            name: GITHUB_ACTOR,
            email: "action@github.com",
        },
        remote: {
            name: "github",
            url: (githubToken: string) =>
                `https://${GITHUB_ACTOR}:${githubToken}@github.com/${GITHUB_REPOSITORY}.git`,
        },
    },
};

export default config;
