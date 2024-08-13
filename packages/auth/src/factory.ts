import { TAuthConfig } from "./types";

export const createConfig = <T extends TAuthConfig>(config: T) => config;
