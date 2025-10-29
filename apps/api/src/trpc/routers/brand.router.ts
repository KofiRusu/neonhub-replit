import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import {
  ingestBrandVoice,
  searchSimilarBrandVoice,
  listBrandVoiceGuides,
  deleteBrandVoiceGuide,
  type BrandVoiceDocument,
} from "../../services/brand-voice-ingestion.js";
import { TRPCError } from "@trpc/server";

export const brandRouter = createTRPCRouter({
  /**
   * Upload and ingest a brand voice guide
   */
  uploadVoiceGuide: protectedProcedure
    .input(
      z.object({
        brandId: z.string().cuid(),
        organizationId: z.string().cuid(),
        content: z.string().min(1).max(100000),
        filename: z.string().min(1),
        mimeType: z.string().default("text/plain"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { brandId, organizationId, content, filename, mimeType } = input;

      // Verify user has access to this brand
      const brand = await ctx.prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.user.id, status: "active" },
              },
            },
          },
        },
      });

      if (!brand || brand.organization.members.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this brand",
        });
      }

      const document: BrandVoiceDocument = {
        content,
        filename,
        mimeType,
      };

      const result = await ingestBrandVoice({
        brandId,
        organizationId,
        document,
      });

      return {
        brandVoiceId: result.brandVoiceId,
        parsed: {
          summary: result.parsed.summary,
          tone: result.parsed.tone,
          vocabulary: result.parsed.vocabulary,
          doExamples: result.parsed.doExamples,
          dontExamples: result.parsed.dontExamples,
        },
      };
    }),

  /**
   * Search for similar brand voice examples
   */
  searchVoice: protectedProcedure
    .input(
      z.object({
        brandId: z.string().cuid(),
        query: z.string().min(1).max(1000),
        limit: z.number().int().min(1).max(10).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const { brandId, query, limit } = input;

      // Verify user has access to this brand
      const brand = await ctx.prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.user.id, status: "active" },
              },
            },
          },
        },
      });

      if (!brand || brand.organization.members.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this brand",
        });
      }

      const results = await searchSimilarBrandVoice({
        brandId,
        query,
        limit,
      });

      return results.map((result) => ({
        id: result.id,
        summary: result.summary,
        metadata: result.metadata,
        similarity: result.similarity,
      }));
    }),

  /**
   * List all brand voice guides for a brand
   */
  listVoiceGuides: protectedProcedure
    .input(
      z.object({
        brandId: z.string().cuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { brandId } = input;

      // Verify user has access to this brand
      const brand = await ctx.prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.user.id, status: "active" },
              },
            },
          },
        },
      });

      if (!brand || brand.organization.members.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this brand",
        });
      }

      const guides = await listBrandVoiceGuides(brandId);

      return guides.map((guide) => ({
        id: guide.id,
        summary: guide.summary,
        metadata: guide.metadata,
        createdAt: guide.createdAt.toISOString(),
      }));
    }),

  /**
   * Delete a brand voice guide
   */
  deleteVoiceGuide: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        brandId: z.string().cuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, brandId } = input;

      // Verify user has access to this brand
      const brand = await ctx.prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.user.id, status: "active" },
              },
            },
          },
        },
      });

      if (!brand || brand.organization.members.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this brand",
        });
      }

      // Verify the voice guide belongs to this brand
      const voiceGuide = await ctx.prisma.brandVoice.findUnique({
        where: { id },
      });

      if (!voiceGuide || voiceGuide.brandId !== brandId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice guide not found",
        });
      }

      await deleteBrandVoiceGuide(id);

      return { success: true };
    }),

  /**
   * Get brand voice context for content generation
   * (Used by ContentAgent to retrieve relevant brand voice examples)
   */
  getVoiceContext: protectedProcedure
    .input(
      z.object({
        brandId: z.string().cuid(),
        contentIntent: z.string().min(1).max(500),
        limit: z.number().int().min(1).max(5).default(3),
      })
    )
    .query(async ({ input, ctx }) => {
      const { brandId, contentIntent, limit } = input;

      // Verify user has access to this brand
      const brand = await ctx.prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.user.id, status: "active" },
              },
            },
          },
        },
      });

      if (!brand || brand.organization.members.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this brand",
        });
      }

      // Search for relevant brand voice examples
      const results = await searchSimilarBrandVoice({
        brandId,
        query: contentIntent,
        limit,
      });

      return {
        brandName: brand.name,
        brandSlogan: brand.slogan ?? undefined,
        voiceExamples: results.map((result) => ({
          summary: result.summary,
          metadata: result.metadata,
          relevanceScore: result.similarity,
        })),
      };
    }),
});
