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
export var OAuthGrantType;
(function (OAuthGrantType) {
    OAuthGrantType["AuthorizationCode"] = "authorization_code";
    OAuthGrantType["ClientCredentials"] = "client_credentials";
    OAuthGrantType["RefreshToken"] = "refresh_token";
})(OAuthGrantType || (OAuthGrantType = {}));
