import { Context } from "./api";
import { OAuthProvider } from "./oauth";
import { TAuthConfig } from "./types";

export const getOAuthTokenForProvider = async (
    auth: TAuthConfig,
    provider: string,
    ctx: Context
) => {
    if (!auth.providers.oauth) throw Error("No oauth providers configured");
    if (!auth.providers.oauth[provider])
        throw Error(provider + " is not configured");
    if (!ctx.session?.userId) {
        throw new Error("UNAUTHORIZED");
    }

    const account = await auth.db.getAccountForProviderByUserId({
        userId: ctx.session.userId,
        provider,
    });

    if (!account) throw Error("No provider account for this user");
    if (!account.access_token) throw Error("No access token for account");

    const oAuthProvider = new OAuthProvider(auth.providers.oauth[provider]);
    const token = oAuthProvider.tokenFromAccount({
        account: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            scope: account.scope || "",
            expires_at: account.expires_at || 0,
        },
    });
    return token;
};
