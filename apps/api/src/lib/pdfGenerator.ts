/**
 * PDF Generator for B2B Proposals
 * Creates professional PDFs with proposal templates
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface ProposalData {
  clientName: string;
  clientCompany: string;
  proposalTitle: string;
  services: string[];
  pricing: {
    item: string;
    amount: number;
  }[];
  timeline: string;
  terms: string;
}

export class PDFGenerator {
  /**
   * Generate B2B proposal PDF
   */
  async generateProposal(data: ProposalData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .fillColor('#6366f1')
        .text('NeonHub Marketing Solutions', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text('AI-Powered Marketing Automation', { align: 'center' })
        .moveDown(2);

      // Title
      doc
        .fontSize(20)
        .fillColor('#111827')
        .text(data.proposalTitle, { align: 'center' })
        .moveDown(0.3);

      doc
        .fontSize(12)
        .fillColor('#6b7280')
        .text(`Prepared for: ${data.clientName}`, { align: 'center' })
        .text(data.clientCompany, { align: 'center' })
        .moveDown(2);

      // Services Section
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('Proposed Services')
        .moveDown(0.5);

      data.services.forEach((service, index) => {
        doc
          .fontSize(12)
          .fillColor('#374151')
          .text(`${index + 1}. ${service}`)
          .moveDown(0.3);
      });

      doc.moveDown(1);

      // Pricing Section
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('Investment')
        .moveDown(0.5);

      let total = 0;
      data.pricing.forEach((item) => {
        total += item.amount;
        doc
          .fontSize(12)
          .fillColor('#374151')
          .text(`${item.item}`, { continued: true })
          .text(`$${item.amount.toLocaleString()}`, { align: 'right' })
          .moveDown(0.3);
      });

      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .fillColor('#111827')
        .text('Total Investment:', { continued: true })
        .text(`$${total.toLocaleString()}`, { align: 'right' })
        .moveDown(1.5);

      // Timeline
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('Timeline')
        .moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#374151')
        .text(data.timeline)
        .moveDown(1.5);

      // Terms
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('Terms & Conditions')
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text(data.terms, {
          align: 'justify',
          lineGap: 3,
        })
        .moveDown(2);

      // Footer
      doc
        .fontSize(10)
        .fillColor('#9ca3af')
        .text('Thank you for considering NeonHub Marketing Solutions', {
          align: 'center',
        })
        .text('For questions, contact us at proposals@neonhub.ai', {
          align: 'center',
        });

      doc.end();
    });
  }

  /**
   * Generate outreach email template
   */
  generateEmailTemplate(companyName: string): string {
    return `
Subject: Transform Your Marketing with AI-Powered Automation

Hi there,

I noticed ${companyName} is doing great work in your industry, and I wanted to reach out personally.

At NeonHub, we help companies like yours:
• Automate content creation with AI
• Track and analyze marketing trends
• Generate qualified leads automatically
• Create personalized outreach at scale

I've attached a custom proposal showing how we could help ${companyName} achieve similar results.

Would you be open to a 15-minute call this week to discuss?

Best regards,
NeonHub Team
https://neonhub.ai
    `.trim();
  }

  /**
   * Get sample proposal data
   */
  getSampleProposal(): ProposalData {
    return {
      clientName: 'John Smith',
      clientCompany: 'Acme Corp',
      proposalTitle: 'AI-Powered Marketing Automation Proposal',
      services: [
        'AI Content Generation - Automated blog posts, social media, and email campaigns',
        'Trend Analysis - Real-time market insights and competitor monitoring',
        'Lead Generation - Intelligent B2B lead discovery and qualification',
        'Campaign Management - Multi-channel campaign orchestration',
      ],
      pricing: [
        { item: 'Platform Setup & Onboarding', amount: 2500 },
        { item: 'Monthly Subscription (6 months)', amount: 3000 },
        { item: 'Custom AI Model Training', amount: 5000 },
        { item: 'Dedicated Account Management', amount: 2000 },
      ],
      timeline: 'Phase 1: Setup & Training (2 weeks)\nPhase 2: Pilot Campaign (4 weeks)\nPhase 3: Full Deployment (Ongoing)',
      terms: 'This proposal is valid for 30 days. Services will be provided on a subscription basis with a 6-month initial commitment. All pricing is in USD. Payment terms: 50% upfront, 50% upon completion of Phase 1. Cancellation policy: 30 days written notice required.',
    };
  }
}

export const pdfGenerator = new PDFGenerator();

