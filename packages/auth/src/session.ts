export interface User {
    id: string;
}

export interface Session {
    id: string;
    userId: string;
    user: () => Promise<User | null>;
}
