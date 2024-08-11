import { OAuthProviderConfig, OAuthOptions } from "@koons/auth";

export interface GithubProfile {
    id: number;
    name: string | null;
    login: string;
    email: string;
    avatar_url: string;
}

export const Github = (options: OAuthOptions): OAuthProviderConfig<GithubProfile> => ({
    id: "github",
    label: "Github",
    type: "oauth",
    authorization: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    userinfo: "https://api.github.com/user",
    scope: options.scope || ["read:user user:email"],
    profile(profile) {
        return {
            id: profile.id.toString(),
            name: profile.name || profile.login,
            email: profile.email,
            image: profile.avatar_url,
          }
    },
    ...options,
})

