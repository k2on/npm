import { ZodTypeAny, infer as ZodInfer, ZodAny } from "zod";

export interface Cli {
    [key: string]: Cli | Command;
}

export const cli = (input: Cli) => input;

type Command<Input = unknown> = {
    describe: (description: string) => Command;
    input: <T extends ZodTypeAny>(schema: T) => Command<ZodInfer<T>>;
    run: (callback: (input: Input) => Promise<void>) => Command<Input>;
    _get: () => {
        description: string | null;
        schema: ZodTypeAny | null;
        fn: (input: unknown) => Promise<void>;
    };
};

const createCommand = (): Command => {
    let description: string | null = null;
    let schema: ZodTypeAny | null = null;
    let fn: (input: unknown) => Promise<void>;

    return {
        describe(desc: string): Command {
            description = desc;
            return this;
        },
        input<T extends ZodTypeAny>(inputSchema: T): Command<ZodInfer<T>> {
            schema = inputSchema;
            return this as unknown as Command<ZodInfer<T>>;
        },
        run(callback: (input: any) => Promise<void>): Command {
            fn = callback;
            return this;
        },
        _get() {
            return {
                description,
                schema,
                fn,
            };
        },
    };
};

export const cmd = createCommand();

export const run = (cli: Cli) => {
    let args = process.argv;
    args.splice(0, 2); // remove first 2 elements

    let menu = cli;

    // @ts-ignore
    const cmdArgs = [];

    while (args.length) {
        const arg = args.shift();
        if (!arg) throw Error(`'${arg}' is not a command`);
        if (!(arg in menu)) {
            cmdArgs.push(arg);
            break;
        }

        // @ts-ignore
        menu = menu[arg];
    }

    if ("_get" in menu) {
        const cmd = menu as unknown as Command;
        const command = cmd._get();

        if (command.schema) {
            // @ts-ignore
            const keys = Object.keys(command.schema.shape);
            const obj = keys.reduce(
                (acc, key, index) => {
                    // @ts-ignore
                    acc[key] = cmdArgs[index];
                    return acc;
                },
                {} as Record<string, unknown>,
            );
            command.fn(obj);
        } else {
            command.fn({});
        }
    } else {
        console.log("Options:");
        for (const [key, val] of Object.entries(menu)) {
            console.log(
                // @ts-ignore
                key + " - " + ("_get" in val ? val._get().description : "Menu"),
            );
        }
    }
};

