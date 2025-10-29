import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import { contentAgent } from "../../agents/content/ContentAgent.js";
import { suggestInternalLinks } from "../../services/internal-linking.js";

const personaIdSchema = z.union([z.number(), z.string()]).optional();

async function assertBrandAccess(prisma: PrismaClient, userId: string, brandId?: string) {
  if (!brandId) {
    return;
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      organization: {
        include: {
          members: {
            where: { userId, status: "active" },
          },
        },
      },
    },
  });

  if (!brand || brand.organization.members.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this brand." });
  }
}

export const contentRouter = createTRPCRouter({
  generateArticle: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3).max(200),
        primaryKeyword: z.string().min(2).max(120),
        personaId: personaIdSchema,
        secondaryKeywords: z.array(z.string().min(2).max(120)).max(6).optional(),
        outline: z.array(z.string().min(3).max(160)).max(10).optional(),
        tone: z.enum(["professional", "casual", "friendly", "authoritative"]).optional(),
        audience: z.string().min(3).max(200).optional(),
        callToAction: z.string().min(3).max(200).optional(),
        brandId: z.string().cuid().optional(),
        brandVoiceId: z.string().cuid().optional(),
        wordCount: z.number().int().min(400).max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertBrandAccess(ctx.prisma, ctx.user.id, input.brandId);

      const result = await contentAgent.generateArticle({
        topic: input.topic,
        primaryKeyword: input.primaryKeyword,
        personaId: input.personaId,
        secondaryKeywords: input.secondaryKeywords,
        outline: input.outline,
        tone: input.tone,
        audience: input.audience,
        callToAction: input.callToAction,
        brandId: input.brandId,
        brandVoiceId: input.brandVoiceId,
        wordCount: input.wordCount,
        createdById: ctx.user.id,
      });

      return result;
    }),

  optimize: protectedProcedure
    .input(
      z.object({
        draftId: z.string().cuid().optional(),
        content: z.string().min(200),
        primaryKeyword: z.string().min(2).max(120),
        personaId: personaIdSchema,
        brandId: z.string().cuid().optional(),
        brandVoiceId: z.string().cuid().optional(),
        callToAction: z.string().min(3).max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertBrandAccess(ctx.prisma, ctx.user.id, input.brandId);

      if (input.draftId) {
        const draft = await ctx.prisma.contentDraft.findUnique({
          where: { id: input.draftId },
          select: { createdById: true },
        });
        if (!draft || draft.createdById !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this draft." });
        }
      }

      return contentAgent.optimizeArticle({
        draftId: input.draftId,
        content: input.content,
        primaryKeyword: input.primaryKeyword,
        personaId: input.personaId,
        brandId: input.brandId,
        brandVoiceId: input.brandVoiceId,
        callToAction: input.callToAction,
        createdById: ctx.user.id,
      });
    }),

  score: protectedProcedure
    .input(
      z.object({
        content: z.string().min(100),
        keywords: z.array(z.string().min(2)).min(1).max(10),
      })
    )
    .query(({ input }) => contentAgent.scoreContent(input.content, input.keywords)),

  meta: protectedProcedure
    .input(
      z.object({
        content: z.string().min(100),
        primaryKeyword: z.string().min(2).max(120),
        titleHint: z.string().min(3).max(120).optional(),
      })
    )
    .mutation(({ input }) =>
      contentAgent.generateMetaTagsForContent(input.content, input.primaryKeyword, input.titleHint)
    ),

  socialSnippets: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3).max(200),
        primaryKeyword: z.string().min(2).max(120),
        brandId: z.string().cuid().optional(),
        brandVoiceId: z.string().cuid().optional(),
        tone: z.enum(["professional", "casual", "friendly", "authoritative"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertBrandAccess(ctx.prisma, ctx.user.id, input.brandId);
      return contentAgent.generateSocialSnippets({
        topic: input.topic,
        primaryKeyword: input.primaryKeyword,
        brandId: input.brandId,
        brandVoiceId: input.brandVoiceId,
        tone: input.tone,
      });
    }),

  schedulePublish: protectedProcedure
    .input(
      z.object({
        draftId: z.string().cuid(),
        publishAt: z.string().transform((value) => new Date(value)),
        personaId: z.number().int().optional(),
        channel: z.string().min(3).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const draft = await ctx.prisma.contentDraft.findUnique({
        where: { id: input.draftId },
        select: { createdById: true },
      });

      if (!draft || draft.createdById !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this draft." });
      }

      await contentAgent.schedulePublication({
        draftId: input.draftId,
        publishAt: input.publishAt,
        personaId: input.personaId,
        channel: input.channel,
      });

      return { success: true };
    }),

  suggestInternalLinks: protectedProcedure
    .input(
      z.object({
        contentId: z.string().cuid(),
        content: z.string().min(100),
        limit: z.number().int().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const contentRecord = await ctx.prisma.content.findUnique({
        where: { id: input.contentId },
        select: { organizationId: true },
      });

      if (!contentRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
      }

      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: contentRecord.organizationId,
          userId: ctx.user.id,
          status: "active",
        },
        select: { id: true },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this content" });
      }

      return suggestInternalLinks({
        contentId: input.contentId,
        content: input.content,
        limit: input.limit,
        prisma: ctx.prisma,
      });
    }),
});
