export interface User {}

export interface Session {
    id: string;
    userId: string;
    // user: () => Promise<User | null>;
}
