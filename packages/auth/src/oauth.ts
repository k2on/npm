import { z, ZodSchema, ZodVoid } from "zod";
import { OAuthProviderConfig, UserProfile } from "./types";

export class OAuthProvider {
    constructor(public config: OAuthProviderConfig<any>) {}

    public async getToken({
        code,
        redirectUri,
    }: {
        code: string;
        redirectUri: string;
    }): Promise<OAuthToken> {
        const credentials = btoa(
            `${this.config.clientId}:${this.config.clientSecret}`
        );
        const response = await fetch(this.config.token, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credentials}`,
                Accept: "application/json",
            },
            body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
        });
        if (!response.ok) {
            console.log(response);
            throw Error("Could not get token");
        }
        const token = (await response.json()) as Token;
        return new OAuthToken(this.config, token);
    }

    public async refreshToken({
        refreshToken,
    }: {
        refreshToken: string;
    }): Promise<OAuthToken> {
        const credentials = btoa(
            `${this.config.clientId}:${this.config.clientSecret}`
        );
        const response = await fetch(this.config.token, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credentials}`,
                Accept: "application/json",
            },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        });
        const token = (await response.json()) as Token;
        return new OAuthToken(this.config, token);
    }

    public tokenFromAccount({
        account,
    }: {
        account: {
            access_token: string;
            refresh_token: string | null;
            scope: string;
            expires_at: number;
        };
    }): OAuthToken {
        if (!account.access_token)
            throw Error("Account does not have an access token");
        const token: Token = {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            scope: account.scope,
            expires_at: account.expires_at,
        };
        return new OAuthToken(this.config, token);
    }
}

export class OAuthToken {
    constructor(public config: OAuthProviderConfig<any>, public token: Token) {}

    public async getUser(): Promise<UserProfile> {
        const response = await fetch(this.config.userinfo, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.token.access_token}`,
                Accept: "application/json",
            },
        });
        const json = await response.json();
        return this.config.profile(json);
    }

    public getAccessToken() {
        return this.token.access_token;
    }
    public getRefreshToken() {
        return this.token.refresh_token;
    }
    public getScope() {
        return this.token.scope;
    }
    public getExpiresAt() {
        return this.token.expires_at;
    }
}

export interface Token {
    access_token: string;
    refresh_token: string | null;
    scope: string;
    expires_at: number;
}

export async function SendFetch<T extends ZodSchema>(
    url: string,
    method: string,
    responseSchema: T,
    token: OAuthToken,
    body?: Record<string, unknown>
): Promise<z.infer<T>> {
    const resp = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token.getAccessToken()}`,
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github+json",
        },
        body: JSON.stringify(body),
    });
    // console.log(resp.headers);
    if (!resp.ok) {
        if (
            resp.headers
                .get("www-authenticate")
                ?.includes("The access token expired")
        ) {
            console.log("Refresh access token");
            const refreshToken = token.getRefreshToken();
            if (!refreshToken) throw Error("No refresh token");

            return await SendFetch<T>(
                url,
                method,
                responseSchema,
                // newToken,
                token,
                body
            );
        } else {
            console.log(resp);
            throw Error("Failed");
        }
    } else {
        if (responseSchema instanceof ZodVoid)
            return null as z.infer<typeof responseSchema>;

        const json = await resp.json();
        try {
            const validated = responseSchema.parse(json);
            return validated as z.infer<typeof responseSchema>;
        } catch (e) {
            console.log("json", JSON.stringify(json, null, 4));
            console.error(e);
            throw e;
        }
    }
}
