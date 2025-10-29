-- Link graph relationships for internal linking engine
CREATE TABLE "link_graph" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "sourceContentId" TEXT NOT NULL,
    "targetContentId" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "link_graph_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "link_graph_sourceContentId_fkey"
      FOREIGN KEY ("sourceContentId") REFERENCES "content"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "link_graph_targetContentId_fkey"
      FOREIGN KEY ("targetContentId") REFERENCES "content"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "link_graph_sourceContentId_targetContentId_anchorText_key"
  ON "link_graph" ("sourceContentId", "targetContentId", "anchorText");

CREATE INDEX "link_graph_organizationId_idx"
  ON "link_graph" ("organizationId");
