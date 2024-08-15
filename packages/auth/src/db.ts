import { PgColumn, PgDatabase, PgTableWithColumns } from "drizzle-orm/pg-core";
import { User } from "./session";
import { and, eq, isNull } from "drizzle-orm";

export interface SessionObj {
    id: string;
    userId: string;
}

export interface Account {
    userId: string;
}

export interface SessionForUser {
    id: string;
    agent: string;
    ip: string;
    expires: Date;
    createdAt: Date;
    lastUsedAt: Date | null;
}

export abstract class Adapter {
    abstract getSessionFromTokenAndUpdateLastUsedAt(
        token: string
    ): Promise<SessionObj[] | null>;

    abstract getUserFromId(id: string): Promise<User | null>;

    abstract getAccountFromProviderAccountId(options: {
        provider: string;
        userId: string;
    }): Promise<Account | null>;

    abstract getUserFromEmail(email: string): Promise<User | null>;

    abstract createUser(input: {
        id: string;
        name: string;
        email: string;
        profileImageUrl: string | null;
    }): Promise<void>;

    abstract createAccount(input: {
        userId: string;
        type: string;
        provider: string;
        providerAccountId: string;
        refresh_token: string | null;
        access_token: string;
        expires_at: number;
        token_type: string;
        scope: string;
        id_token: any;
        session_state: any;
    }): Promise<void>;

    abstract createSession(input: {
        id: string;
        userId: string;
        sessionToken: string;
        expires: Date;
        agent: string;
        ip: string;
    }): Promise<void>;

    abstract getSessionsForUser(userId: string): Promise<SessionForUser[]>;

    abstract revokeSession(id: string): Promise<void>;
    abstract revokeAllFromUser(id: string): Promise<void>;
    abstract getSessionForUserFromId(options: {
        sessionId: string;
        userId: string;
    }): Promise<SessionObj | null>;
}

export class DrizzlePostgres extends Adapter {
    constructor(
        private config: {
            db: PgDatabase<any, any>;
            users: PostgreSQLUserTable;
            sessions: PostgreSQLSessionTable;
            accounts: PostgreSQLAccountTable;
        }
    ) {
        super();
    }

    async getSessionFromTokenAndUpdateLastUsedAt(
        token: string
    ): Promise<SessionObj[] | null> {
        return await this.config.db
            .update(this.config.sessions)
            .set({ lastUsedAt: new Date() })
            .where(
                and(
                    eq(this.config.sessions.sessionToken, token),
                    isNull(this.config.sessions.revokedAt)
                )
            )
            .returning();
    }

    async getUserFromId(id: string): Promise<User | null> {
        const [user] = await this.config.db
            .select()
            .from(this.config.users)
            .where(eq(this.config.users.id, id));
        return user || null;
    }

    async getAccountFromProviderAccountId(options: {
        provider: string;
        userId: string;
    }): Promise<Account | null> {
        const [account] = await this.config.db
            .select()
            .from(this.config.accounts)
            .where(
                and(
                    eq(this.config.accounts.provider, options.provider),
                    eq(this.config.accounts.providerAccountId, options.userId)
                )
            );
        return account || null;
    }

    async getUserFromEmail(email: string): Promise<User | null> {
        const [user] = await this.config.db
            .select()
            .from(this.config.users)
            .where(eq(this.config.users.email, email));
        return user || null;
    }

    async createUser(input: {
        id: string;
        name: string;
        email: string;
        profileImageUrl: string | null;
    }): Promise<void> {
        await this.config.db.insert(this.config.users).values(input);
    }

    async createAccount(input: {
        userId: string;
        type: string;
        provider: string;
        providerAccountId: string;
        refresh_token: string | null;
        access_token: string;
        expires_at: number;
        token_type: string;
        scope: string;
        id_token: any;
        session_state: any;
    }): Promise<void> {
        await this.config.db.insert(this.config.accounts).values(input);
    }

    async createSession(input: {
        id: string;
        userId: string;
        sessionToken: string;
        expires: Date;
        agent: string;
        ip: string;
    }): Promise<void> {
        await this.config.db.insert(this.config.sessions).values(input);
    }

    async getSessionsForUser(userId: string): Promise<SessionForUser[]> {
        return await this.config.db
            .select({
                id: this.config.sessions.id,
                agent: this.config.sessions.agent,
                ip: this.config.sessions.ip,
                expires: this.config.sessions.expires,
                createdAt: this.config.sessions.createdAt,
                lastUsedAt: this.config.sessions.lastUsedAt,
            })
            .from(this.config.sessions)
            .where(
                and(
                    eq(this.config.sessions.userId, userId),
                    isNull(this.config.sessions.revokedAt)
                )
            );
    }

    async revokeSession(id: string): Promise<void> {
        await this.config.db
            .update(this.config.sessions)
            .set({ revokedAt: new Date() })
            .where(eq(this.config.sessions.id, id));
    }

    async revokeAllFromUser(id: string): Promise<void> {
        await this.config.db
            .update(this.config.sessions)
            .set({ revokedAt: new Date() })
            .where(eq(this.config.sessions.userId, id));
    }

    async getSessionForUserFromId(options: {
        sessionId: string;
        userId: string;
    }): Promise<SessionObj | null> {
        const [session] = await this.config.db
            .select()
            .from(this.config.sessions)
            .where(
                and(
                    eq(this.config.sessions.id, options.sessionId),
                    eq(this.config.sessions.userId, options.userId)
                )
            );
        return session || null;
    }
}

export interface Register {}

export type UserId = Register extends {
    UserId: infer _UserId;
}
    ? _UserId
    : string;

export type PostgreSQLUserTable = PgTableWithColumns<{
    dialect: "pg";
    columns: {
        id: PgColumn<
            {
                name: any;
                tableName: any;
                dataType: any;
                columnType: any;
                data: UserId;
                driverParam: any;
                notNull: true;
                hasDefault: boolean; // must be boolean instead of any to allow default values
                enumValues: any;
                baseColumn: any;
            },
            {}
        >;
        email: PgColumn<
            {
                dataType: any;
                notNull: false;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: UserId;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
    };
    schema: any;
    name: any;
}>;

export type PostgreSQLSessionTable = PgTableWithColumns<{
    dialect: "pg";
    columns: {
        id: PgColumn<
            {
                name: any;
                tableName: any;
                dataType: any;
                columnType: any;
                data: string;
                driverParam: any;
                notNull: true;
                hasDefault: boolean; // must be boolean instead of any to allow default values
                enumValues: any;
                baseColumn: any;
            },
            {}
        >;
        createdAt: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: Date;
                driverParam: any;
                hasDefault: true;
                name: any;
            },
            {}
        >;
        revokedAt: PgColumn<
            {
                dataType: any;
                notNull: false;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: Date;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        lastUsedAt: PgColumn<
            {
                dataType: any;
                notNull: false;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: Date;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        expires: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: Date;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        sessionToken: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: string;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        userId: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: UserId;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        ip: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: string;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        agent: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: string;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
    };
    schema: any;
    name: any;
}>;

export type PostgreSQLAccountTable = PgTableWithColumns<{
    dialect: "pg";
    columns: {
        userId: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: string;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        provider: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: string;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
        providerAccountId: PgColumn<
            {
                dataType: any;
                notNull: true;
                enumValues: any;
                tableName: any;
                columnType: any;
                data: string;
                driverParam: any;
                hasDefault: false;
                name: any;
            },
            {}
        >;
    };
    schema: any;
    name: any;
}>;
