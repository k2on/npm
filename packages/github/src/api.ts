import { z, ZodSchema } from "zod";
import { OAuthToken, SendFetch } from "@koons/auth";

export class GithubClient {
    constructor(public token: OAuthToken) {}

    public async fetch<T extends ZodSchema>(
        url: string,
        method: "POST" | "GET" | "PUT" | "PATCH",
        responseSchema: T,
        body?: Record<string, unknown>
    ): Promise<z.infer<T>> {
        return SendFetch(url, method, responseSchema, this.token, body);
    }

    public async get<T extends ZodSchema>(url: string, responseSchema: T) {
        return await this.fetch(url, "GET", responseSchema);
    }

    public async post<T extends ZodSchema>(
        url: string,
        responseSchema: T,
        body: Record<string, unknown>
    ) {
        return await this.fetch(url, "POST", responseSchema, body);
    }

    public async patch<T extends ZodSchema>(
        url: string,
        responseSchema: T,
        body: Record<string, unknown>
    ) {
        return await this.fetch(url, "PATCH", responseSchema, body);
    }

    public async put<T extends ZodSchema>(url: string, responseSchema: T) {
        return await this.fetch(url, "PUT", responseSchema);
    }
}

export function GithubInterface(client: GithubClient) {
    return {
        user: new User(client),
        git: new Git(client),
    };
}

export const userRepositoriesResponseSchema = z.array(
    z.object({
        id: z.number(),
        name: z.string(),
    })
);

export const listReposOptionsSchema = z.object({
    sort: z.enum(["created", "updated", "pushed", "full_name"]).optional(),
    type: z.enum(["all", "owner", "public", "private", "member"]).optional(),
    visibility: z.enum(["all", "public", "private"]).optional(),
});

export class User {
    constructor(public client: GithubClient) {}

    public async listRepos(options: z.infer<typeof listReposOptionsSchema>) {
        return await this.client.get(
            "https://api.github.com/user/repos?" +
                new URLSearchParams(options).toString(),
            userRepositoriesResponseSchema
        );
    }
}

export const getRefOptionsSchema = z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
});

export const getGetRefResponseSchema = z.object({
    ref: z.string(),
    node_id: z.string(),
    url: z.string(),
    object: z.object({
        type: z.string(),
        sha: z.string(),
        url: z.string(),
    }),
});

export const getCommitOptionsSchema = z.object({
    owner: z.string(),
    repo: z.string(),
    commit_sha: z.string(),
});

export const getGetCommitResponseSchema = z.object({
    sha: z.string(),
    node_id: z.string(),
    url: z.string(),
    html_url: z.string(),
    author: z.object({ date: z.string(), name: z.string(), email: z.string() }),
    committer: z.object({
        date: z.string(),
        name: z.string(),
        email: z.string(),
    }),
    message: z.string(),
    tree: z.object({ url: z.string(), sha: z.string() }),
    parents: z.array(
        z.object({ url: z.string(), sha: z.string(), html_url: z.string() })
    ),
    verification: z.object({
        verified: z.boolean(),
        reason: z.string(),
        signature: z.string().nullable(),
        payload: z.string().nullable(),
    }),
});

export class Git {
    constructor(public client: GithubClient) {}

    public async getRef(options: z.infer<typeof getRefOptionsSchema>) {
        return await this.client.get(
            `https://api.github.com/repos/${options.owner}/${options.repo}/git/ref/${options.ref}`,
            getGetRefResponseSchema
        );
    }

    updateRefOptionsSchema = z.object({
        owner: z.string(),
        repo: z.string(),
        ref: z.string(),
        sha: z.string(),
        force: z.boolean().optional(),
    });

    updateRefResponseSchema = z.object({
        ref: z.string(),
        node_id: z.string(),
        url: z.string(),
        object: z.object({
            type: z.string(),
            sha: z.string(),
            url: z.string(),
        }),
    });

    public async updateRef(
        options: z.infer<typeof this.updateRefOptionsSchema>
    ) {
        return await this.client.patch(
            `https://api.github.com/repos/${options.owner}/${options.repo}/git/refs/${options.ref}`,
            this.updateRefResponseSchema,
            { sha: options.sha, force: options.force }
        );
    }

    public async getCommit(options: z.infer<typeof getCommitOptionsSchema>) {
        return await this.client.get(
            `https://api.github.com/repos/${options.owner}/${options.repo}/git/commits/${options.commit_sha}`,
            getGetCommitResponseSchema
        );
    }

    createBlobOptionsSchema = z.object({
        owner: z.string(),
        repo: z.string(),
        content: z.string(),
        encoding: z.enum(["utf-8", "base64"]).optional(),
    });

    createBlobResponseSchema = z.object({
        url: z.string(),
        sha: z.string(),
    });

    public async createBlob(
        options: z.infer<typeof this.createBlobOptionsSchema>
    ) {
        return await this.client.post(
            `https://api.github.com/repos/${options.owner}/${options.repo}/git/blobs`,
            this.createBlobResponseSchema,
            { content: options.content, encoding: options.encoding || "utf-8" }
        );
    }

    createTreeOptionsSchema = z.object({
        owner: z.string(),
        repo: z.string(),
        base_tree: z.string(),
        tree: z.array(
            z.object({
                path: z.string(),
                mode: z.string(),
                type: z.string(),
                sha: z.string(),
            })
        ),
    });

    createTreeResponseSchema = z.object({
        sha: z.string(),
        url: z.string(),
        tree: z.array(
            z.object({
                path: z.string(),
                mode: z.string(),
                type: z.string(),
                size: z.number().optional(),
                sha: z.string(),
                url: z.string(),
            })
        ),
        truncated: z.boolean(),
    });

    public async createTree(
        options: z.infer<typeof this.createTreeOptionsSchema>
    ) {
        return await this.client.post(
            `https://api.github.com/repos/${options.owner}/${options.repo}/git/trees`,
            this.createTreeResponseSchema,
            { base_tree: options.base_tree, tree: options.tree }
        );
    }

    createCommitOptionsSchema = z.object({
        owner: z.string(),
        repo: z.string(),
        message: z.string(),
        tree: z.string(),
        author: z
            .object({
                name: z.string(),
                email: z.string().email(),
                date: z.date(),
            })
            .optional(),
        parents: z.array(z.string()).optional(),
        signature: z.string().optional(),
    });

    createCommitResponseSchema = z.object({
        sha: z.string(),
        node_id: z.string(),
        url: z.string(),
        author: z.object({
            date: z.string(),
            name: z.string(),
            email: z.string(),
        }),
        committer: z.object({
            date: z.string(),
            name: z.string(),
            email: z.string(),
        }),
        message: z.string(),
        tree: z.object({ url: z.string(), sha: z.string() }),
        parents: z.array(
            z.object({
                url: z.string(),
                sha: z.string(),
                html_url: z.string(),
            })
        ),
        verification: z.object({
            verified: z.boolean(),
            reason: z.string(),
            signature: z.null(),
            payload: z.null(),
        }),
        html_url: z.string(),
    });

    public async createCommit(
        options: z.infer<typeof this.createCommitOptionsSchema>
    ) {
        return await this.client.post(
            `https://api.github.com/repos/${options.owner}/${options.repo}/git/commits`,
            this.createCommitResponseSchema,
            {
                message: options.message,
                tree: options.tree,
                author: options.author
                    ? {
                          ...options.author,
                          ...{ date: options.author.date.toISOString() },
                      }
                    : undefined,
                parents: options.parents,
                signature: options.signature,
            }
        );
    }
}
