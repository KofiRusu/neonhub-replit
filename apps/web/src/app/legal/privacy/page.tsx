export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h2>Introduction</h2>
        <p>
          Welcome to NeonHub. We're committed to protecting your privacy and being transparent about how we collect,
          use, and safeguard your information. This Privacy Policy explains our practices in straightforward language.
        </p>

        <h2>Information We Collect</h2>
        
        <h3>Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Email address, name, organization details</li>
          <li><strong>Content Data:</strong> Articles, keywords, brand voice guidelines you create or upload</li>
          <li><strong>Integration Credentials:</strong> OAuth tokens for connected services (encrypted at rest)</li>
          <li><strong>Payment Information:</strong> Processed securely via Stripe (we don't store card numbers)</li>
        </ul>

        <h3>Information We Collect Automatically</h3>
        <ul>
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
          <li><strong>Analytics:</strong> Search Console data, SEO metrics (impressions, clicks, CTR)</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
          <li><strong>Cookies:</strong> Authentication tokens, preferences, analytics (see Cookie Policy below)</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li><strong>Provide Services:</strong> Generate content, analyze keywords, optimize SEO</li>
          <li><strong>Improve Platform:</strong> Train algorithms, fix bugs, enhance features</li>
          <li><strong>Communicate:</strong> Send product updates, security alerts, support responses</li>
          <li><strong>Security:</strong> Detect fraud, prevent abuse, enforce Terms of Service</li>
          <li><strong>Legal Compliance:</strong> Respond to legal requests, protect our rights</li>
        </ul>

        <h2>Data Sharing & Third Parties</h2>
        <p>We do not sell your data. We share information only when necessary:</p>
        <ul>
          <li><strong>Service Providers:</strong> OpenAI (content generation), Neon.tech (database hosting), Vercel (web hosting)</li>
          <li><strong>Connected Services:</strong> Google Search Console, social platforms (only data you authorize)</li>
          <li><strong>Legal Requirements:</strong> If required by law or to protect rights/safety</li>
        </ul>

        <h2>Your Rights (GDPR & CCPA)</h2>
        <ul>
          <li><strong>Access:</strong> Request a copy of your data</li>
          <li><strong>Correction:</strong> Update inaccurate information</li>
          <li><strong>Deletion:</strong> Request account and data deletion</li>
          <li><strong>Portability:</strong> Export your data in machine-readable format</li>
          <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
          <li><strong>Object:</strong> Object to processing for legitimate interests</li>
        </ul>
        <p>
          To exercise these rights, email <a href="mailto:privacy@neonhub.ai">privacy@neonhub.ai</a>. 
          We'll respond within 30 days.
        </p>

        <h2>Data Security</h2>
        <p>We protect your data using:</p>
        <ul>
          <li>End-to-end encryption for data in transit (TLS 1.3)</li>
          <li>Encryption at rest for sensitive data (AES-256)</li>
          <li>OAuth tokens encrypted with industry-standard algorithms</li>
          <li>Regular security audits and penetration testing</li>
          <li>Access controls and role-based permissions</li>
        </ul>

        <h2>Data Retention</h2>
        <ul>
          <li><strong>Active Content:</strong> Stored indefinitely while your account is active</li>
          <li><strong>Analytics Data:</strong> Retained for 2 years for trend analysis</li>
          <li><strong>Deleted Accounts:</strong> 30-day grace period, then permanent deletion</li>
          <li><strong>Backups:</strong> Maintained for 90 days for disaster recovery</li>
          <li><strong>Audit Logs:</strong> Retained for 1 year (legal compliance), then archived</li>
        </ul>

        <h2>Cookies & Tracking</h2>
        <p>We use cookies for:</p>
        <ul>
          <li><strong>Essential:</strong> Authentication, security (cannot be disabled)</li>
          <li><strong>Analytics:</strong> Understand usage patterns (can opt out)</li>
          <li><strong>Preferences:</strong> Remember your settings (optional)</li>
        </ul>
        <p>
          Manage cookie preferences in your account settings or browser settings.
        </p>

        <h2>International Data Transfers</h2>
        <p>
          Your data may be processed in the United States (AWS US-East-2 for database, Vercel global CDN).
          We use Standard Contractual Clauses (SCCs) for GDPR compliance when transferring EU data.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          NeonHub is not intended for users under 16. We do not knowingly collect data from children.
          If you believe we've collected data from a child, contact us immediately for deletion.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy to reflect changes in our practices or legal requirements.
          We'll notify you via email for material changes. Continued use after changes constitutes acceptance.
        </p>

        <h2>Contact Us</h2>
        <p>
          For privacy questions or to exercise your rights:
        </p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:privacy@neonhub.ai">privacy@neonhub.ai</a></li>
          <li><strong>Address:</strong> NeonHub Data Protection Officer, [Your Business Address]</li>
          <li><strong>Response Time:</strong> Within 30 days</li>
        </ul>

        <h2>Legal Basis for Processing (GDPR)</h2>
        <p>We process your data based on:</p>
        <ul>
          <li><strong>Contract:</strong> To provide the services you signed up for</li>
          <li><strong>Consent:</strong> For marketing communications (you can withdraw anytime)</li>
          <li><strong>Legitimate Interests:</strong> To improve our platform and prevent fraud</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
        </ul>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Stay Neon. Stay Secure.</h3>
          <p className="text-sm text-muted-foreground">
            Your trust powers our innovation. We're committed to protecting your data as rigorously
            as we optimize your SEO. Questions? We're here to help.
          </p>
        </div>
      </div>
    </div>
  );
}
