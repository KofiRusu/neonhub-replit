import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const appendRowSchema = z.object({
  spreadsheetId: z.string().min(1),
  range: z.string().min(1),
  values: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
});

const readRangeSchema = z.object({
  spreadsheetId: z.string().min(1),
  range: z.string().min(1),
});

async function sheetsFetch<T>(path: string, auth: ConnectorAuthContext, init: RequestInit = {}): Promise<T> {
  if (!auth.accessToken) {
    throw new Error("Google Sheets connector requires an access token");
  }

  const response = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class GoogleSheetsConnector extends Connector {
  constructor() {
    super({
      name: "google_sheets",
      displayName: "Google Sheets",
      description: "Read from and write to Google Sheets spreadsheets.",
      category: "productivity",
      iconUrl: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x128.png",
      websiteUrl: "https://sheets.google.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive.metadata.readonly",
        ],
      },
    });
  }

  actions = [
    {
      id: "appendRow",
      name: "Append Row",
      description: "Append one or more rows to the end of a sheet.",
      inputSchema: appendRowSchema,
      execute: async ({ auth, input }) => {
        const payload = appendRowSchema.parse(input);
        const result = await retryManager.run(() =>
          sheetsFetch<{ updates: { updatedRange: string } }>(
            `spreadsheets/${payload.spreadsheetId}/values/${encodeURIComponent(payload.range)}:append`,
            auth,
            {
              method: "POST",
              body: JSON.stringify({
                values: payload.values,
                valueInputOption: "USER_ENTERED",
              }),
            }
          )
        );
        return result;
      },
    },
    {
      id: "readRange",
      name: "Read Range",
      description: "Read values from a specific sheet range.",
      inputSchema: readRangeSchema,
      execute: async ({ auth, input }) => {
        const payload = readRangeSchema.parse(input);
        const result = await retryManager.run(() =>
          sheetsFetch<{ range: string; values?: unknown[][] }>(
            `spreadsheets/${payload.spreadsheetId}/values/${encodeURIComponent(payload.range)}`,
            auth,
            { method: "GET" }
          )
        );
        return result;
      },
    },
  ];

  triggers = [
    {
      id: "newRow",
      name: "New Row Added",
      description: "Triggers when new rows are appended to the selected sheet.",
      pollingIntervalSeconds: 120,
      inputSchema: readRangeSchema.extend({
        cursorColumn: z.number().default(1),
      }),
      run: async ({ auth, settings, cursor }) => {
        const payload = readRangeSchema.extend({ cursorColumn: z.number().default(1) }).parse(settings ?? {});
        const result = await sheetsFetch<{ values?: string[][] }>(
          `spreadsheets/${payload.spreadsheetId}/values/${encodeURIComponent(payload.range)}`,
          auth,
          { method: "GET" }
        );

        const values = result.values ?? [];
        const items = values.filter(row => {
          if (row.length === 0) return false;
          const cell = row[payload.cursorColumn - 1];
          if (!cursor) return true;
          return cell > cursor;
        });

        const newCursor = values.length > 0 ? values[values.length - 1][payload.cursorColumn - 1] : cursor ?? null;

        return {
          cursor: newCursor ?? null,
          items,
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await sheetsFetch("spreadsheets?fields=spreadsheetId", auth, { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
