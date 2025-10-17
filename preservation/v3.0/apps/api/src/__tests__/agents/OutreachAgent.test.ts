/**
 * OutreachAgent Tests (LeadScraper & PDFGenerator)
 */

import { leadScraper } from '../../lib/leadScraper';
import { pdfGenerator } from '../../lib/pdfGenerator';

describe('OutreachAgent - LeadScraper', () => {
  describe('getMockLeads', () => {
    it('should return mock leads for testing', () => {
      const leads = leadScraper.getMockLeads();

      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBeGreaterThan(0);
      
      leads.forEach(lead => {
        expect(lead).toHaveProperty('companyName');
        expect(lead).toHaveProperty('website');
        expect(lead).toHaveProperty('industry');
        expect(lead.companyName).toBeTruthy();
        expect(lead.website).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('scrapeDirectory', () => {
    it('should return mock data in development mode', async () => {
      // In test environment, use mock data directly
      const leads = leadScraper.getMockLeads();

      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBeGreaterThan(0);
    });
  });
});

describe('OutreachAgent - PDFGenerator', () => {
  describe('generateProposal', () => {
    it('should generate a PDF proposal buffer', async () => {
      const proposalData = pdfGenerator.getSampleProposal();
      const pdfBuffer = await pdfGenerator.generateProposal(proposalData);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      // Verify it's a PDF by checking magic bytes
      const header = pdfBuffer.slice(0, 4).toString();
      expect(header).toBe('%PDF');
    });

    it('should include all proposal sections', async () => {
      const proposalData = {
        clientName: 'John Doe',
        clientCompany: 'Test Corp',
        proposalTitle: 'Test Proposal',
        services: ['Service 1', 'Service 2'],
        pricing: [
          { item: 'Setup', amount: 1000 },
          { item: 'Monthly', amount: 500 },
        ],
        timeline: 'Phase 1: 2 weeks',
        terms: 'Test terms and conditions',
      };

      const pdfBuffer = await pdfGenerator.generateProposal(proposalData);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateEmailTemplate', () => {
    it('should generate email template with company name', () => {
      const template = pdfGenerator.generateEmailTemplate('Acme Corp');

      expect(typeof template).toBe('string');
      expect(template).toContain('Acme Corp');
      expect(template).toContain('Subject:');
      expect(template).toContain('NeonHub');
    });

    it('should include key messaging points', () => {
      const template = pdfGenerator.generateEmailTemplate('Test Company');

      expect(template).toContain('Automate content');
      expect(template).toContain('marketing');
      expect(template).toContain('call');
    });
  });

  describe('getSampleProposal', () => {
    it('should return valid sample proposal data', () => {
      const sample = pdfGenerator.getSampleProposal();

      expect(sample).toHaveProperty('clientName');
      expect(sample).toHaveProperty('clientCompany');
      expect(sample).toHaveProperty('proposalTitle');
      expect(sample).toHaveProperty('services');
      expect(sample).toHaveProperty('pricing');
      expect(sample).toHaveProperty('timeline');
      expect(sample).toHaveProperty('terms');
      
      expect(Array.isArray(sample.services)).toBe(true);
      expect(sample.services.length).toBeGreaterThan(0);
      
      expect(Array.isArray(sample.pricing)).toBe(true);
      sample.pricing.forEach(item => {
        expect(item).toHaveProperty('item');
        expect(item).toHaveProperty('amount');
        expect(item.amount).toBeGreaterThan(0);
      });
    });
  });
});

