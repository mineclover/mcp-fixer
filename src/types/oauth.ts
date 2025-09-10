import { z } from 'zod';

export const OAuthConfigurationSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  providerName: z.string().min(1),
  authorizationUrl: z.string().url().startsWith('https://'),
  tokenUrl: z.string().url().startsWith('https://'),
  clientId: z.string().min(1),
  scopes: z.array(z.string()).optional(),
  additionalParams: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OAuthConfiguration = z.infer<typeof OAuthConfigurationSchema>;

export const OAuthTokenSchema = z.object({
  id: z.string(),
  oauthConfigId: z.string(),
  accessTokenEncrypted: z.string().min(1),
  refreshTokenEncrypted: z.string().optional(),
  tokenType: z.enum(['Bearer', 'Basic']).default('Bearer'),
  expiresAt: z.date().optional(),
  scope: z.string().optional(),
  createdAt: z.date(),
  lastRefreshed: z.date().optional(),
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;

export interface OAuthConfigurationCreateInput {
  toolId: string;
  providerName: string;
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  additionalParams?: Record<string, unknown>;
}

export interface OAuthFlowOptions {
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  customParams?: Record<string, string>;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  [key: string]: unknown;
}

export interface OAuthTokenRefreshResult {
  success: boolean;
  token?: OAuthToken;
  error?: string;
}

export enum OAuthGrantType {
  AuthorizationCode = 'authorization_code',
  ClientCredentials = 'client_credentials',
  RefreshToken = 'refresh_token',
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}