const { GITHUB_REPOSITORY, GITHUB_ACTOR } = process.env;

const config = {
    git: {
        branch: "develop",
        user: {
            name: "GitHub Action",
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
