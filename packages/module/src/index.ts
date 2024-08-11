import { z } from "zod";

export const moduleSchema = z.object({
    name: z.string(),
    description: z.string(),
});

export type Module = z.infer<typeof moduleSchema>;

export const createModule = (config: Module) => config;
