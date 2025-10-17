/**
 * Lead Scraper using Puppeteer
 * Crawls company directories to extract B2B leads
 */

import puppeteer, { Browser, Page } from 'puppeteer';

export interface Lead {
  companyName: string;
  website: string;
  industry: string;
  contactEmail?: string;
  contactName?: string;
  linkedinUrl?: string;
  description?: string;
}

export class LeadScraper {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape leads from a company directory
   */
  async scrapeDirectory(url: string, maxPages: number = 5): Promise<Lead[]> {
    if (!this.browser) {
      await this.initialize();
    }

    const leads: Lead[] = [];
    const page = await this.browser!.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Generic scraping logic - adapt based on directory structure
      for (let i = 0; i < maxPages; i++) {
        const pageLeads = await this.extractLeadsFromPage(page);
        leads.push(...pageLeads);

        // Try to find and click next page button
        const hasNextPage = await this.goToNextPage(page);
        if (!hasNextPage) break;
      }
    } catch (error) {
      console.error('Scraping error:', error);
    } finally {
      await page.close();
    }

    return leads;
  }

  /**
   * Extract leads from current page
   */
  private async extractLeadsFromPage(page: Page): Promise<Lead[]> {
    return await page.evaluate(() => {
      const leads: Lead[] = [];
      
      // Generic selectors - adapt for specific directories
      const companyElements = document.querySelectorAll('.company, .listing, [data-company]');
      
      companyElements.forEach((element: Element) => {
        const nameEl = element.querySelector('h2, h3, .company-name, [data-name]');
        const websiteEl = element.querySelector('a[href*="http"], .website');
        const industryEl = element.querySelector('.industry, .category, [data-industry]');
        const descEl = element.querySelector('.description, p');

        if (nameEl) {
          leads.push({
            companyName: nameEl.textContent?.trim() || '',
            website: websiteEl?.getAttribute('href') || '',
            industry: industryEl?.textContent?.trim() || 'Unknown',
            description: descEl?.textContent?.trim(),
          });
        }
      });

      return leads;
    });
  }

  /**
   * Navigate to next page
   */
  private async goToNextPage(page: Page): Promise<boolean> {
    try {
      const nextButton = await page.$('a.next, button.next, [aria-label*="Next"]');
      if (!nextButton) return false;

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        nextButton.click(),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scrape company details from specific URL
   */
  async scrapeCompanyDetails(url: string): Promise<Partial<Lead>> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    const details: Partial<Lead> = {};

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      details.contactEmail = await page.evaluate(() => {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const text = document.body.innerText;
        const matches = text.match(emailRegex);
        return matches ? matches[0] : undefined;
      });

      details.linkedinUrl = await page.evaluate(() => {
        const linkedinLink = document.querySelector('a[href*="linkedin.com"]');
        return linkedinLink?.getAttribute('href') || undefined;
      });
    } catch (error) {
      console.error('Error scraping company details:', error);
    } finally {
      await page.close();
    }

    return details;
  }

  /**
   * Get mock leads for testing
   */
  getMockLeads(): Lead[] {
    return [
      {
        companyName: 'Acme Corp',
        website: 'https://acmecorp.com',
        industry: 'Technology',
        contactEmail: 'info@acmecorp.com',
        contactName: 'John Smith',
        description: 'Leading provider of enterprise software solutions',
      },
      {
        companyName: 'TechStart Inc',
        website: 'https://techstart.io',
        industry: 'SaaS',
        contactEmail: 'hello@techstart.io',
        contactName: 'Jane Doe',
        description: 'Innovative startup in the AI space',
      },
      {
        companyName: 'Global Marketing Solutions',
        website: 'https://globalmarketing.com',
        industry: 'Marketing',
        contactEmail: 'contact@globalmarketing.com',
        description: 'Full-service marketing agency for B2B companies',
      },
    ];
  }
}

export const leadScraper = new LeadScraper();

