import { describe, expect, it, jest } from "@jest/globals";

class FakePdfDocument {
  private handlers: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, handler: (...args: any[]) => void) {
    this.handlers[event] = this.handlers[event] ?? [];
    this.handlers[event].push(handler);
    return this;
  }

  fontSize() {
    return this;
  }

  fillColor() {
    return this;
  }

  text() {
    return this;
  }

  moveDown() {
    return this;
  }

  end() {
    this.handlers["data"]?.forEach((handler) => handler(Buffer.from("pdf")));
    this.handlers["end"]?.forEach((handler) => handler());
  }
}

jest.mock("pdfkit", () => ({
  __esModule: true,
  default: FakePdfDocument,
}));

describe("PDF generator", () => {
  it("generates proposal buffers", async () => {
    const { PDFGenerator } = await import("../pdfGenerator.js");

    const generator = new PDFGenerator();
    const buffer = await generator.generateProposal({
      clientName: "Alex Johnson",
      clientCompany: "Future Corp",
      proposalTitle: "AI Automation Proposal",
      services: ["Automation", "Analytics"],
      pricing: [
        { item: "Setup", amount: 1000 },
        { item: "Subscription", amount: 2000 },
      ],
      timeline: "6 weeks",
      terms: "Net 30",
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString()).toContain("pdf");
  });

  it("provides email templates and sample proposals", async () => {
    const { PDFGenerator } = await import("../pdfGenerator.js");
    const generator = new PDFGenerator();

    const email = generator.generateEmailTemplate("Orbit Labs");
    expect(email).toContain("Orbit Labs");

    const proposal = generator.getSampleProposal();
    expect(proposal.clientCompany).toBeDefined();
    expect(proposal.pricing.length).toBeGreaterThan(0);
  });
});
