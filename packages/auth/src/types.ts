export type Providers = Record<string, AuthProvider>;

export type OAuthProviders = Record<string, OAuthProviderConfig<any>>;
export type OTPProviders = Record<string, OTPAuthProviderConfig<any>>;

export interface TAuthConfig {
    providers: {
        oauth?: OAuthProviders;
        otp?: OTPProviders;
    };
}

export type AuthProviderType = "oauth" | "otp";

export interface AuthProviderBase {
    id: string;
    label: string;
    type: AuthProviderType;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    image?: string;
}

export type OAuthProviderConfig<P> = AuthProviderBase & {
    type: "oauth";
    clientId: string;
    clientSecret: string;
    scope: string[];
    authorization: string;
    token: string;
    userinfo: string;
    profile: (profile: P) => UserProfile;
};

export interface OTPAuthProviderConfig<I> extends AuthProviderBase {
    type: "otp";
    columnName: string;
    sendCode: (input: I) => Promise<boolean>;
    verifyCode: (input: I, code: string) => Promise<boolean>;
}

export type AuthProvider =
    | OAuthProviderConfig<any>
    | OTPAuthProviderConfig<any>;

export interface OAuthOptions {
    clientId: string;
    clientSecret: string;
    scope?: string[];
}
