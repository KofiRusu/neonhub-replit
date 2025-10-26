import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const createTaskSchema = z.object({
  workspaceGid: z.string().min(1),
  projectGid: z.string().optional(),
  name: z.string().min(1),
  notes: z.string().optional(),
  assignee: z.string().optional(),
  dueOn: z.string().optional(),
});

const listTasksSchema = z.object({
  projectGid: z.string().optional(),
  sectionGid: z.string().optional(),
  assignee: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

async function asanaFetch<T>(auth: ConnectorAuthContext, path: string, init: RequestInit = {}) {
  if (!auth.accessToken) throw new Error("Asana connector requires an access token");

  const response = await fetch(`https://app.asana.com/api/1.0/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Asana API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export class AsanaConnector extends Connector {
  constructor() {
    super({
      name: "asana",
      displayName: "Asana",
      description: "Create and track tasks in Asana projects.",
      category: "project_management",
      iconUrl: "https://asana.com/favicon.ico",
      websiteUrl: "https://asana.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://app.asana.com/-/oauth_authorize",
        tokenUrl: "https://app.asana.com/-/oauth_token",
        scopes: ["default"],
      },
    });
  }

  actions = [
    {
      id: "createTask",
      name: "Create Task",
      description: "Create a new task in Asana.",
      inputSchema: createTaskSchema,
      execute: async ({ auth, input }) => {
        const payload = createTaskSchema.parse(input);
        return retryManager.run(() =>
          asanaFetch(auth, "tasks", {
            method: "POST",
            body: JSON.stringify({
              data: {
                workspace: payload.workspaceGid,
                projects: payload.projectGid ? [payload.projectGid] : undefined,
                name: payload.name,
                notes: payload.notes,
                assignee: payload.assignee,
                due_on: payload.dueOn,
              },
            }),
          })
        );
      },
    },
  ];

  triggers = [
    {
      id: "taskUpdated",
      name: "Task Updated",
      description: "Triggers when tasks are updated in a project or section.",
      pollingIntervalSeconds: 180,
      inputSchema: listTasksSchema,
      run: async ({ auth, settings, cursor }) => {
        const payload = listTasksSchema.parse(settings ?? {});
        const params = new URLSearchParams({
          limit: String(payload.limit),
          opt_fields: "name,completed,assignee,status,modified_at",
        });
        if (payload.projectGid) params.set("project", payload.projectGid);
        if (payload.sectionGid) params.set("section", payload.sectionGid);
        if (payload.assignee) params.set("assignee.any", payload.assignee);
        if (cursor) params.set("offset", cursor);

        const result = await asanaFetch<{
          data: Array<{ gid: string; modified_at: string }>;
          next_page?: { offset: string | null };
        }>(auth, `tasks?${params.toString()}`, { method: "GET" });

        return {
          cursor: result.next_page?.offset ?? null,
          items: result.data,
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await asanaFetch(auth, "users/me", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
