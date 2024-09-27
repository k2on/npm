export interface User {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    profileImageUrl: string | null;
}

export interface Session {
    id: string;
    userId: string;
    user: () => Promise<User | null>;
}
