import { Session } from "./session";
import { TAuthConfig } from "./types";

export const makeAuth =
    <T extends TAuthConfig>(authConfig: T) =>
    async (headers: Headers): Promise<Session | null> => {
        const token = headers.get("authorization");
        if (!token) return null;

        const updated =
            await authConfig.db.getSessionFromTokenAndUpdateLastUsedAt(token);
        if (!updated) return null;
        const session = updated.at(0);

        if (!session) return null;
        return {
            id: session.id,
            userId: session.userId,
            user: () => authConfig.db.getUserFromId(session.userId),
            // user: () =>
            // db.query.users.findFirst({
            //     where: eq(schema.users.id, session.userId),
            // }),
            // authConfig.db.getUser(session.userId),
        };
    };
