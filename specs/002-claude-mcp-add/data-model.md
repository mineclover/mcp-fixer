# Data Model: MCP Server Fixed Interface Optimization

**Feature**: 002-claude-mcp-add  
**Date**: 2025-09-10  
**Dependencies**: Extends data model from 001-mcp-tool-mcp

## Entity Overview

This feature extends the existing MCP tool management system with fixed interface optimization capabilities. All entities build upon the foundation from 001-mcp-tool-mcp.

## Core Entities

### FixedInterface
**Purpose**: Pre-defined, optimized interface specification for an MCP tool function
**Extends**: Leverages existing Tool entity from 001 spec

**Attributes**:
- `id: string` - Unique identifier (UUID)
- `toolId: string` - Foreign key to existing Tool entity  
- `name: string` - Human-readable fixed interface name
- `displayName: string` - User-friendly interface name
- `description?: string` - Optional description of interface purpose
- `schemaJson: string` - JSON Schema for parameter validation (Zod compatible)
- `parametersJson: string` - Default/template parameters as JSON
- `responseSchemaJson: string` - Expected response format schema
- `version: string` - Semantic version (MAJOR.MINOR.PATCH)
- `isActive: boolean` - Whether interface is available for use (default: true)
- `createdAt: Date` - Creation timestamp
- `lastValidated?: Date` - Last successful validation against MCP server
- `validationErrors?: string` - JSON array of validation issues if any

**Relationships**:
- Many-to-One with Tool (from 001 spec)
- One-to-Many with PerformanceMetric
- Many-to-One with OAuthConfiguration (optional)

**Validation Rules**:
- `name` must be unique within a tool
- `schemaJson` must be valid JSON Schema
- `version` must follow semantic versioning
- `parametersJson` must validate against `schemaJson`

**State Transitions**:
- Draft → Active (after successful validation)
- Active → Deprecated (when newer version available)
- Active → Invalid (when validation fails)
- Invalid → Active (after re-validation/repair)

### OAuthConfiguration
**Purpose**: OAuth 2.0 setup and credential management for MCP servers
**Relationship**: Extends authentication from existing Credential entity (001 spec)

**Attributes**:
- `id: string` - Unique identifier (UUID)
- `toolId: string` - Foreign key to Tool entity
- `providerName: string` - OAuth provider name (e.g., "notion", "github")
- `authorizationUrl: string` - OAuth authorization endpoint
- `tokenUrl: string` - OAuth token exchange endpoint  
- `clientId: string` - OAuth client identifier
- `scopes?: string` - JSON array of requested scopes
- `additionalParams?: string` - JSON object of extra OAuth parameters
- `createdAt: Date` - Configuration creation time
- `updatedAt: Date` - Last modification time

**Relationships**:
- Many-to-One with Tool
- One-to-Many with OAuthToken

**Validation Rules**:
- `authorizationUrl` and `tokenUrl` must be valid HTTPS URLs
- `clientId` required and non-empty
- `scopes` must be valid JSON array if provided
- One configuration per tool-provider combination

### OAuthToken
**Purpose**: Secure storage of OAuth access and refresh tokens
**Security**: All token data encrypted at rest

**Attributes**:
- `id: string` - Unique identifier (UUID)
- `oauthConfigId: string` - Foreign key to OAuthConfiguration
- `accessTokenEncrypted: string` - Encrypted OAuth access token
- `refreshTokenEncrypted?: string` - Encrypted OAuth refresh token (if available)
- `tokenType: string` - Token type (usually "Bearer")
- `expiresAt?: Date` - Access token expiration time
- `scope?: string` - Actual granted scopes (may differ from requested)
- `createdAt: Date` - Token creation time
- `lastRefreshed?: Date` - Last successful token refresh

**Relationships**:
- Many-to-One with OAuthConfiguration
- Implicitly linked to Tool through OAuthConfiguration

**Security Rules**:
- All token fields encrypted with AES-256
- Automatic cleanup of expired tokens
- Token refresh attempted automatically before expiration
- Secure deletion when tokens revoked

**State Transitions**:
- Fresh → Active (after successful token exchange)
- Active → Expiring (within refresh threshold)
- Expiring → Active (after successful refresh)
- Expiring → Expired (if refresh fails)
- Active/Expiring/Expired → Revoked (user/provider action)

### PerformanceMetric
**Purpose**: Track response times and success rates for fixed vs dynamic interface usage
**Analytics**: Support performance optimization decisions

**Attributes**:
- `id: string` - Unique identifier (UUID)
- `interfaceId?: string` - Foreign key to FixedInterface (null for dynamic access)
- `toolId: string` - Foreign key to Tool entity
- `accessType: 'fixed' | 'dynamic'` - Type of interface access
- `operationName: string` - MCP tool operation name
- `responseTimeMs: number` - Response time in milliseconds
- `success: boolean` - Whether operation succeeded
- `errorMessage?: string` - Error details if success = false
- `errorCategory?: string` - Error classification (auth, network, validation, etc.)
- `timestamp: Date` - When measurement was taken
- `metadata?: string` - Additional context as JSON

**Relationships**:
- Many-to-One with Tool
- Many-to-One with FixedInterface (optional)

**Analytics Capabilities**:
- Performance trend analysis (fixed vs dynamic)
- Error pattern identification  
- Interface usage frequency tracking
- Success rate monitoring per interface

**Validation Rules**:
- `responseTimeMs` must be positive integer
- `accessType` must be enum value
- `interfaceId` required when `accessType = 'fixed'`
- `errorMessage` required when `success = false`

## Extended Entities (from 001 spec)

### Tool (Extended)
**New Relationships**:
- One-to-Many with FixedInterface
- One-to-Many with OAuthConfiguration  
- One-to-Many with PerformanceMetric

**New Optional Attributes**:
- `supportsOAuth: boolean` - Whether tool requires OAuth authentication
- `oauthProvider?: string` - OAuth provider identifier
- `fixedInterfaceCount: number` - Computed count of active fixed interfaces

### Credential (Extended)
**Enhanced for OAuth**:
- Support for encrypted OAuth token storage
- Integration with OAuthToken entity for token-based authentication
- Backward compatibility with existing credential types

## Database Relationships

```
Tool (001) ──┬─── FixedInterface (new)
             ├─── OAuthConfiguration (new) ─── OAuthToken (new)  
             ├─── PerformanceMetric (new)
             └─── Credential (001, extended)

FixedInterface ─── PerformanceMetric
```

## Entity Lifecycle Management

### FixedInterface Lifecycle
1. **Registration**: Extract from successful dynamic MCP operation
2. **Validation**: Test against live MCP server
3. **Activation**: Mark as active for fixed access
4. **Monitoring**: Periodic validation and performance tracking
5. **Deprecation**: Mark deprecated when newer version available
6. **Removal**: Archive inactive/invalid interfaces

### OAuth Token Lifecycle  
1. **Authorization**: User completes OAuth flow
2. **Token Exchange**: Authorization code exchanged for tokens
3. **Storage**: Tokens encrypted and stored securely
4. **Usage**: Access token used for MCP server authentication
5. **Refresh**: Automatic token refresh before expiration
6. **Revocation**: Secure deletion when access revoked

## Data Integrity Constraints

### Foreign Key Constraints
- FixedInterface.toolId → Tool.id (CASCADE DELETE)
- OAuthConfiguration.toolId → Tool.id (CASCADE DELETE)
- OAuthToken.oauthConfigId → OAuthConfiguration.id (CASCADE DELETE)
- PerformanceMetric.toolId → Tool.id (CASCADE DELETE)
- PerformanceMetric.interfaceId → FixedInterface.id (SET NULL)

### Business Logic Constraints
- Maximum 50 fixed interfaces per tool
- OAuth tokens automatically cleaned up after 90 days if unused
- Performance metrics retained for 30 days for analytics
- Fixed interface names must be unique within tool scope

## Migration Strategy

### Database Schema Migration
1. Extend existing SQLite database from 001 spec
2. Add new tables with foreign key relationships
3. Preserve existing data and functionality
4. Add indexes for performance optimization

### Data Migration
- No existing data to migrate (new feature)
- Compatibility maintained with existing Tool and Credential entities
- Graceful fallback to dynamic discovery when fixed interfaces unavailable

---

**Status**: Complete ✓  
**Next**: Generate contracts and test specifications