import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "neonhub-default" },
    update: {},
    create: {
      name: "NeonHub Default",
      slug: "neonhub-default"
    }
  });

  const connectors = [
    { key: "http", name: "HTTP", version: "1.0.0" },
    { key: "slack", name: "Slack", version: "1.0.0" },
    { key: "notion", name: "Notion", version: "1.0.0" },
    { key: "github", name: "GitHub", version: "1.0.0" },
    { key: "sheets", name: "Google Sheets", version: "1.0.0" }
  ];

  await Promise.all(
    connectors.map(connector =>
      prisma.connector.upsert({
        where: { key: connector.key },
        update: {
          name: connector.name,
          version: connector.version
        },
        create: connector
      })
    )
  );

  const workflow = await prisma.workflow.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: "HTTP to Slack" } },
    update: {},
    create: {
      name: "HTTP to Slack",
      workspaceId: workspace.id
    }
  });

  const dag = {
    nodes: [
      {
        id: "n1",
        type: "action",
        connector: "http",
        action: "get",
        config: {
          url: "https://httpbin.org/get"
        }
      },
      {
        id: "n2",
        type: "action",
        connector: "slack",
        action: "postMessage",
        config: {
          channel: "#neonhub",
          text: "Hello from NeonHub: {{ n1.response.url }}"
        }
      }
    ],
    edges: [{ from: "n1", to: "n2" }]
  };

  const version = await prisma.workflowVersion.upsert({
    where: { workflowId_version: { workflowId: workflow.id, version: 1 } },
    update: {
      dagJson: dag,
      status: "published"
    },
    create: {
      workflowId: workflow.id,
      version: 1,
      dagJson: dag,
      status: "published"
    }
  });

  await prisma.workflow.update({
    where: { id: workflow.id },
    data: {
      latestVersionId: version.id
    }
  });

  console.info("Seed data applied", { workspace: workspace.slug, workflow: workflow.name });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
