import { randomBytes } from "crypto";
import { URLSearchParams } from "url";

export interface OAuth2Config {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  audience?: string;
  extraAuthorizeParams?: Record<string, string>;
}

export interface AuthorizationRequest {
  url: string;
  state: string;
  codeVerifier?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export class OAuth2Provider {
  constructor(private readonly config: OAuth2Config) {}

  buildAuthorizeUrl(state: string, codeChallenge?: string) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state,
    });

    if (this.config.audience) {
      params.set("audience", this.config.audience);
    }

    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }

    if (this.config.extraAuthorizeParams) {
      for (const [key, value] of Object.entries(this.config.extraAuthorizeParams)) {
        params.set(key, value);
      }
    }

    return `${this.config.authorizeUrl}?${params.toString()}`;
  }

  async getAuthorizationRequest(): Promise<AuthorizationRequest> {
    const state = randomBytes(16).toString("hex");
    // TODO: implement PKCE generation if needed
    const url = this.buildAuthorizeUrl(state);
    return { url, state };
  }

  async exchangeCode(code: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OAuth2 token exchange failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as TokenResponse;
    return payload;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OAuth2 refresh failed (${response.status}): ${text}`);
    }

    return (await response.json()) as TokenResponse;
  }

  /**
   * Check if an access token is expired or will expire soon (within 5 minutes)
   */
  isTokenExpired(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) {
      // No expiry data - assume valid
      return false;
    }
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return expiresAt.getTime() - now.getTime() < bufferMs;
  }
}
