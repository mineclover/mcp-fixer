// Model exports
export * from './tool';
export * from './query';
export * from './credential';
export * from './collector';
export * from './execution';
export * from './fixed-interface';
export * from './oauth-configuration';
export * from './oauth-token';
export * from './performance-metric';

// Re-export commonly used types
export type {
  Tool,
  ToolCreate,
  ToolUpdate,
  ToolValidationResult,
  ToolDiscoveryResult,
  ToolStats,
} from './tool';

export type {
  Query,
  QueryCreate,
  QueryUpdate,
  QueryExecutionParams,
  QueryExecutionResult,
  QueryValidationResult,
  QueryStats,
  PreparedOperation,
} from './query';

export type {
  Credential,
  CredentialCreate,
  CredentialUpdate,
  CredentialData,
  DecryptedCredential,
  CredentialListItem,
  CredentialValidationResult,
  CredentialTestResult,
} from './credential';

export type {
  Collector,
  CollectorCreate,
  CollectorUpdate,
  CollectorModule,
  CollectorExecutionResult,
  CollectorValidationResult,
  CollectorStats,
  CollectorChainResult,
} from './collector';

export type {
  Execution,
  ExecutionCreate,
  ExecutionUpdate,
  ExecutionContext,
  ExecutionSummary,
  ExecutionStats,
  ExecutionError,
  ExecutionMetrics,
  RetryConfig,
} from './execution';

export type {
  FixedInterface,
  FixedInterfaceCreate,
  FixedInterfaceUpdate,
  InterfaceValidationResult,
  InterfaceExecutionParams,
  InterfaceExecutionResult,
  FixedInterfaceListFilters,
  FixedInterfaceStats,
  StateTransition,
} from './fixed-interface';

export type {
  OAuthConfiguration,
  OAuthConfigurationCreate,
  OAuthConfigurationUpdate,
  OAuthConfigurationValidationResult,
  PKCEParams,
  OAuthAuthorizationRequest,
  OAuthTokenExchangeRequest,
  OAuthConfigurationListFilters,
  OAuthConfigurationStats,
} from './oauth-configuration';

export type {
  OAuthToken,
  OAuthTokenCreate,
  OAuthTokenUpdate,
  TokenRefreshRequest,
  TokenRefreshResult,
  TokenValidationResult,
  TokenUsageContext,
  OAuthTokenListFilters,
  OAuthTokenStats,
  EncryptionConfig,
} from './oauth-token';

export type {
  PerformanceMetric,
  PerformanceMetricCreate,
  PerformanceMetricUpdate,
  PerformanceComparison,
  PerformanceAnalytics,
  PerformanceThreshold,
  PerformanceAlert,
  PerformanceMetricListFilters,
  PerformanceStats,
  BenchmarkConfig,
  BenchmarkResult,
} from './performance-metric';

// Model utility classes
export { ToolModel } from './tool';
export { QueryModel } from './query';
export { CredentialModel } from './credential';
export { CollectorModel } from './collector';
export { ExecutionModel } from './execution';
export { FixedInterfaceModel } from './fixed-interface';
export { OAuthConfigurationModel } from './oauth-configuration';
export { OAuthTokenModel } from './oauth-token';
export { PerformanceMetricModel } from './performance-metric';