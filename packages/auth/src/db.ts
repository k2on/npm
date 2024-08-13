import {
    PgColumn,
    PgDatabase,
    PgTableWithColumns,
    TableConfig,
} from "drizzle-orm/pg-core";
import { User } from "./session";
import { Table } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export abstract class Adapter {
    abstract getUsers(): Promise<User[] | null>;
}

export class DrizzlePostgres extends Adapter {
    constructor(
        private config: {
            db: PgDatabase<any, any>;
            users: PostgreSQLUserTable;
            sessions: PostgreSQLSessionTable;
        }
    ) {
        super();
    }

    async getUsers(): Promise<User[] | null> {
        return await this.config.db.select().from(this.config.users);
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
