import { logger } from "../../lib/logger.js";

interface Timestamped {
  id: string;
  createdAt: string;
}

function deterministicId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

export class GoogleSheetsMockConnector {
  async listRows(sheetId: string, range: string) {
    logger.debug({ sheetId, range }, "[MOCK] Google Sheets listRows");
    return {
      sheetId,
      range,
      rows: [
        ["Header A", "Header B", "Header C"],
        ["Value 1", "Value 2", "Value 3"],
      ],
    };
  }

  async appendRow(sheetId: string, range: string, values: Array<string | number>) {
    logger.debug({ sheetId, range, values }, "[MOCK] Google Sheets appendRow");
    return {
      sheetId,
      range,
      values,
      updatedRange: `${range}!A${values.length + 1}`,
    };
  }
}

export class TrelloMockConnector {
  async listBoards() {
    logger.debug("[MOCK] Trello listBoards");
    return [
      { id: "board_1", name: "Growth Experiments" },
      { id: "board_2", name: "Support Queue" },
    ];
  }

  async createCard(boardId: string, listId: string, title: string, description?: string): Promise<Timestamped> {
    logger.debug({ boardId, listId, title }, "[MOCK] Trello createCard");
    return {
      id: deterministicId("trello-card"),
      createdAt: new Date().toISOString(),
      boardId,
      listId,
      title,
      description: description ?? null,
    } as Timestamped & { boardId: string; listId: string; title: string; description: string | null };
  }
}

export class NotionMockConnector {
  async listPages(databaseId: string) {
    logger.debug({ databaseId }, "[MOCK] Notion listPages");
    return [
      { id: deterministicId("notion-page"), title: "Playbook", status: "draft" },
      { id: deterministicId("notion-page"), title: "Launch Checklist", status: "approved" },
    ];
  }

  async createPage(databaseId: string, title: string, properties: Record<string, unknown>) {
    logger.debug({ databaseId, title }, "[MOCK] Notion createPage");
    return {
      id: deterministicId("notion-page"),
      title,
      databaseId,
      properties,
      url: `https://notion.so/mock/${encodeURIComponent(title)}`,
    };
  }
}

export class AsanaMockConnector {
  async createTask(projectId: string, name: string, assignee?: string) {
    logger.debug({ projectId, name }, "[MOCK] Asana createTask");
    return {
      id: deterministicId("asana-task"),
      projectId,
      name,
      assignee: assignee ?? null,
      status: "pending",
    };
  }

  async listTasks(projectId: string) {
    logger.debug({ projectId }, "[MOCK] Asana listTasks");
    return [
      { id: deterministicId("asana-task"), name: "Kickoff brief", status: "complete" },
      { id: deterministicId("asana-task"), name: "QA pass", status: "in_progress" },
    ];
  }
}

export class HubSpotMockConnector {
  async createContact(email: string, traits: Record<string, unknown> = {}) {
    logger.debug({ email }, "[MOCK] HubSpot createContact");
    return {
      id: deterministicId("hubspot-contact"),
      email,
      traits,
      lifecycleStage: "lead",
    };
  }

  async listContacts(limit = 5) {
    logger.debug({ limit }, "[MOCK] HubSpot listContacts");
    return Array.from({ length: limit }).map((_, index) => ({
      id: deterministicId("hubspot-contact"),
      email: `contact${index + 1}@example.com`,
      lifecycleStage: index === 0 ? "customer" : "lead",
    }));
  }
}
