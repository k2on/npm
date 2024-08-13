import { Session } from "./session";
import { TAuthConfig } from "./types";

export const makeAuth =
    <T extends TAuthConfig>(authConfig: T) =>
    async (headers: Headers): Promise<Session | null> => {
        const token = headers.get("authorization");
        if (!token) return null;

        // const users = await authConfig.db.getUsers();
        // console.log("users", users);

        // const updated = await db
        //     .update(schema.sessions)
        //     .set({ lastUsedAt: new Date() })
        //     .where(
        //         and(
        //             eq(schema.sessions.sessionToken, token),
        //             isNull(schema.sessions.revokedAt)
        //         )
        //     )
        //     .returning();
        const session: any = null;

        if (!session) return null;
        return {
            id: session.id,
            userId: session.userId,
            // user: () =>
            // db.query.users.findFirst({
            //     where: eq(schema.users.id, session.userId),
            // }),
            // authConfig.db.getUser(session.userId),
        };
    };
