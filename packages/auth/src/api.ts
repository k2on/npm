import { z } from "zod";
import { TAuthConfig } from "./types";
import { OAuthProvider } from "./oauth";
import { randomUUID } from "crypto";

// const OTPProviderValidator = z.enum(
//     Object.keys(authConfig.providers.otp) as [
//         keyof typeof authConfig.providers.otp,
//     ],
// );

type Context = {
    from: {
        agent: string;
        ip: string;
    };
};
type ContextAuthed = {
    session: {
        id: string;
        userId: string;
    };
    from: {
        agent: string;
        ip: string;
    };
};

export function makeRoutes(auth: TAuthConfig) {
    const OAuthProviderValidator = auth.providers.oauth
        ? z.enum(
              Object.keys(auth.providers.oauth) as [
                  keyof typeof auth.providers.oauth
              ]
          )
        : z.enum([""]); // TODO: FIX ME

    const oauthCallbackInput = z.object({
        code: z.string(),
        provider: OAuthProviderValidator,
        redirectUri: z.string(),
    });

    const revokeInput = z.object({ id: z.string() });

    return {
        config: {
            query: () => ({
                // otp: Object.fromEntries(
                //     Object.entries(authConfig.providers.otp).map(
                //         ([key, config]) => [
                //             key,
                //             {
                //                 type: "otp" as const,
                //                 id: config.id,
                //                 label: config.label,
                //             },
                //         ],
                //     ),
                // ),
                oauth:
                    auth.providers.oauth &&
                    Object.fromEntries(
                        Object.entries(auth.providers.oauth).map(
                            ([key, config]) => [
                                key,
                                {
                                    type: "oauth" as const,
                                    id: config.id,
                                    label: config.label,
                                    clientId: config.clientId,
                                    scope: config.scope,
                                    token: config.token,
                                    authorization: config.authorization,
                                },
                            ]
                        )
                    ),
            }),
        },
        oauthCallback: {
            input: oauthCallbackInput,
            mutation: async ({
                input,
                ctx,
            }: {
                ctx: Context;
                input: z.infer<typeof oauthCallbackInput>;
            }) => {
                if (!auth.providers.oauth) throw Error("No oauth providers");
                const config = auth.providers.oauth[input.provider];
                if (!config) throw Error("Provider not found");
                const provider = new OAuthProvider(config);
                const token = await provider.getToken(input);
                console.log("token", token);
                const user = await token.getUser();

                const account = await auth.db.getAccountFromProviderAccountId({
                    provider: input.provider,
                    userId: user.id,
                });

                const id = randomUUID();
                const sessionToken = randomUUID();
                if (!account) {
                    const userWithEmail = await auth.db.getUserFromEmail(
                        user.email
                    );

                    if (userWithEmail)
                        throw new Error(
                            "A user with this email already exists"
                        );

                    const userId = randomUUID();

                    await auth.db.createUser({
                        id: userId,
                        name: user.name,
                        email: user.email,
                        profileImageUrl: user.image || null,
                    });

                    await auth.db.createAccount({
                        userId,
                        type: "oauth",
                        provider: input.provider,
                        providerAccountId: user.id,
                        refresh_token: token.getRefreshToken(),
                        access_token: token.getAccessToken(),
                        expires_at: token.getExpiresAt(),
                        token_type: "idk",
                        scope: token.getScope(),
                        id_token: undefined,
                        session_state: undefined,
                    });

                    await auth.db.createSession({
                        id,
                        userId,
                        sessionToken,
                        expires: new Date(
                            new Date().getTime() +
                                1000 * 60 * 60 * 24 * 365 * 10
                        ),
                        agent: ctx.from.agent,
                        ip: ctx.from.ip,
                    });

                    return sessionToken as string;
                } else {
                    auth.db.createSession({
                        id,
                        userId: account.userId,
                        sessionToken,
                        expires: new Date(
                            new Date().getTime() +
                                1000 * 60 * 60 * 24 * 365 * 10
                        ),
                        agent: ctx.from.agent,
                        ip: ctx.from.ip,
                    });

                    return sessionToken as string;
                }
            },
        },
        listSessions: {
            query: async ({ ctx }: { ctx: ContextAuthed }) => {
                return await auth.db.getSessionsForUser(ctx.session.userId);
            },
        },
        logout: {
            mutation: async ({ ctx }: { ctx: ContextAuthed }) => {
                await auth.db.revokeSession(ctx.session.id);
                return true;
            },
        },
        revokeAll: {
            mutation: async ({ ctx }: { ctx: ContextAuthed }) => {
                await auth.db.revokeAllFromUser(ctx.session.userId);
                return true;
            },
        },
        revoke: {
            input: revokeInput,
            mutation: async ({
                ctx,
                input,
            }: {
                ctx: ContextAuthed;
                input: z.infer<typeof revokeInput>;
            }) => {
                const session = await auth.db.getSessionForUserFromId({
                    sessionId: input.id,
                    userId: ctx.session.userId,
                });
                if (!session) throw new Error("Session not found");
                await auth.db.revokeSession(input.id);
                // await ctx.db
                //     .update(schema.sessions)
                //     .set({ revokedAt: new Date() })
                //     .where(eq(schema.sessions.id, input.id));
                return true;
            },
        },
    };
}
