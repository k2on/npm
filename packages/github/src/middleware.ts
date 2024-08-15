import { Context, getOAuthTokenForProvider, TAuthConfig } from "@koons/auth";
import { GithubClient, GithubInterface } from "./api";

export const enforceGithub = async (authConfig: TAuthConfig, ctx: Context) => {
    const token = await getOAuthTokenForProvider(authConfig, "github", ctx);
    const client = new GithubClient(token);
    const github = GithubInterface(client);
    return github;
};
