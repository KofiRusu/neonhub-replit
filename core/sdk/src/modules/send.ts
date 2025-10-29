/**
 * Multi-channel Sending Module
 * @module modules/send
 */

import type { HTTPClient } from '../client';
import type {
  EmailSendArgs,
  SMSSendArgs,
  DMSendArgs,
  SendResult,
  SendStatus,
} from '../types/agentic';

export class SendModule {
  constructor(private readonly client: HTTPClient) {}

  /**
   * Send personalized email
   *
   * @example
   * ```typescript
   * const result = await client.send.email({
   *   to: 'per_123',
   *   subject: 'Quick question about your workflow',
   *   html: '<p>Here is the variant we loved...</p>',
   *   body: 'Fallback plain text version',
   *   objective: 'demo_book'
   * });
   *
   * console.log('Sent:', result.id);
   * ```
   */
  async email(args: EmailSendArgs): Promise<SendResult> {
    const payload = {
      ...args,
      to: args.to ?? args.personId,
    };
    return this.client.post<SendResult>('/email/send', {
      body: payload,
    });
  }

  /**
   * Send personalized SMS
   *
   * @example
   * ```typescript
   * const result = await client.send.sms({
   *   to: 'per_123',
   *   body: 'Got 30 seconds for a quick win on your reporting workflow?',
   *   objective: 'winback'
   * });
   * ```
   */
  async sms(args: SMSSendArgs): Promise<SendResult> {
    const payload = {
      ...args,
      to: args.to ?? args.personId,
    };
    return this.client.post<SendResult>('/sms/send', {
      body: payload,
    });
  }

  /**
   * Send personalized DM (Instagram, X, WhatsApp, etc.)
   *
   * @example
   * ```typescript
   * const result = await client.send.dm({
   *   platform: 'instagram',
   *   to: 'per_123',
   *   body: 'Promise this is the fastest nurture loop you will see this week.',
   *   objective: 'nurture'
   * });
   * ```
   */
  async dm(args: DMSendArgs): Promise<SendResult> {
    const payload = {
      ...args,
      to: args.to ?? args.personId,
    };
    return this.client.post<SendResult>(`/social/${args.platform}/dm`, {
      body: payload,
    });
  }

  /**
   * Get send status with events
   *
   * @example
   * ```typescript
   * const status = await client.send.getStatus('send_789');
   * console.log(status.status); // 'opened'
   * console.log(status.events); // [{ type: 'email.sent', ts: ... }, ...]
   * ```
   */
  async getStatus(sendId: string): Promise<SendStatus> {
    return this.client.get<SendStatus>(`/send/${sendId}/status`);
  }

  /**
   * Cancel a scheduled send
   */
  async cancel(sendId: string): Promise<void> {
    await this.client.post(`/send/${sendId}/cancel`);
  }

  /**
   * Get send history for a person
   */
  async getHistory(
    personId: string,
    opts?: {
      channels?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ sends: SendResult[]; total: number }> {
    return this.client.get(`/person/${personId}/sends`, {
      query: opts,
    });
  }

  /**
   * Bulk send to multiple persons
   */
  async bulk(
    args: Omit<EmailSendArgs | SMSSendArgs | DMSendArgs, 'personId'> & {
      personIds: string[];
    }
  ): Promise<{ jobId: string; queued: number }> {
    return this.client.post('/send/bulk', {
      body: args,
    });
  }

  /**
   * Get bulk send job status
   */
  async getBulkStatus(jobId: string) {
    return this.client.get(`/send/bulk/${jobId}`);
  }
}
