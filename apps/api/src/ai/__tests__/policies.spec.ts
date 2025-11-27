import { describe, expect, it } from "@jest/globals";
import { moderationCheck, enforceBrandRules } from "../policies/moderation";
import { selectConstraint, shouldFallback, DEFAULT_CONSTRAINTS } from "../policies/routing";
import { TaskSpecSchema, PlanStepSchema, ArticleSpecSchema, EmailSpecSchema, SocialPostSpecSchema } from "../policies/schemas";

describe("ai policies", () => {
  it("detects moderation violations and enforces brand tone", () => {
    const safe = moderationCheck("Welcome to NeonHub!");
    expect(safe.ok).toBe(true);
    expect(safe.violations).toHaveLength(0);

    const flagged = moderationCheck("This includes a password: hunter2");
    expect(flagged.ok).toBe(false);
    expect(flagged.violations).toContain("/password/i");

    const toneOk = enforceBrandRules("Confident and friendly voice", { tone: ["friendly"] });
    expect(toneOk).toEqual({ ok: true, message: "tone aligned" });

    const toneMissing = enforceBrandRules("Formal voice", { tone: ["playful"] });
    expect(toneMissing).toEqual({ ok: false, message: "missing brand tone signal" });
  });

  it("selects routing constraints based on tone, channel, and defaults", () => {
    const toneMatch = selectConstraint({ objective: "Plan", tone: "friendly" });
    expect(toneMatch.agent).toBe("ContentAgent");

    const emailConstraint = selectConstraint({ objective: "Email launch", channel: "email" });
    expect(emailConstraint.agent).toBe("EmailAgent");

    const socialConstraint = selectConstraint({ objective: "Tweet", channel: "social" });
    expect(socialConstraint.agent).toBe("SocialAgent");

    const fallbackConstraint = selectConstraint({ objective: "Unknown channel" });
    expect(DEFAULT_CONSTRAINTS).toContainEqual(fallbackConstraint);

    expect(shouldFallback(0.7, socialConstraint)).toBe(false);
    expect(shouldFallback(0.5, socialConstraint)).toBe(true);
    expect(shouldFallback(0.6, emailConstraint)).toBe(true);
  });

  it("validates task schemas and rejects invalid input", () => {
    const task = TaskSpecSchema.parse({ objective: "Launch plan", channel: "blog" });
    expect(task.objective).toBe("Launch plan");

    expect(() => TaskSpecSchema.parse({ objective: "x" })).toThrow();

    const planStep = PlanStepSchema.parse({ id: "1", title: "Draft", detail: "Write copy" });
    expect(planStep.title).toBe("Draft");

    const article = ArticleSpecSchema.parse({
      headline: "NeonHub reaches GA",
      outline: ["Intro", "Features", "CTA"],
    });
    expect(article.outline).toHaveLength(3);

    const email = EmailSpecSchema.parse({
      subject: "NeonHub launch",
      callToAction: "Book a demo",
    });
    expect(email.callToAction).toBe("Book a demo");

    const social = SocialPostSpecSchema.parse({
      platform: "twitter",
      copy: "NeonHub v3.2 is live!",
    });
    expect(social.platform).toBe("twitter");
  });
});
