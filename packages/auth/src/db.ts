import { PgColumn, PgDatabase, PgTableWithColumns } from "drizzle-orm/pg-core";
import { User } from "./session";
import { and, eq, isNull } from "drizzle-orm";

export interface SessionObj {
    id: string;
    userId: string;
}

export abstract class Adapter {
    abstract getSessionFromTokenAndUpdateLastUsedAt(
        token: string,
    ): Promise<SessionObj[] | null>;

    abstract getUserFromId(id: string): Promise<User | null>;
}

export class DrizzlePostgres extends Adapter {
    constructor(
        private config: {
            db: PgDatabase<any, any>;
            users: PostgreSQLUserTable;
            sessions: PostgreSQLSessionTable;
        },
    ) {
        super();
    }

    async getSessionFromTokenAndUpdateLastUsedAt(
        token: string,
    ): Promise<SessionObj[] | null> {
        return await this.config.db
            .update(this.config.sessions)
            .set({ lastUsedAt: new Date() })
            .where(
                and(
                    eq(this.config.sessions.sessionToken, token),
                    isNull(this.config.sessions.revokedAt),
                ),
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
    };
    schema: any;
    name: any;
}>;
