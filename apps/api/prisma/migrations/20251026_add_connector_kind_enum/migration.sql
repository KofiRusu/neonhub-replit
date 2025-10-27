-- CreateEnum
CREATE TYPE "ConnectorKind" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'REDDIT', 'INSTAGRAM', 'FACEBOOK', 'X', 'YOUTUBE', 'TIKTOK', 'GOOGLE_ADS', 'SHOPIFY', 'STRIPE', 'SLACK', 'DISCORD', 'LINKEDIN');

-- AlterTable
ALTER TABLE "connectors" ALTER COLUMN "category" SET DATA TYPE "ConnectorKind" USING ("category"::"ConnectorKind");
