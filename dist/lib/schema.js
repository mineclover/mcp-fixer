// Database schema definitions
// This file contains all the SQL statements needed to initialize the database
export const SCHEMA_VERSION = '1.0.0';
// Individual SQL statements for database schema
export const SCHEMA_STATEMENTS = [
    // Enable foreign key constraints
    'PRAGMA foreign_keys = ON',
    // Version tracking table
    `CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
  )`,
    // Tools table
    `CREATE TABLE tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    endpoint TEXT NOT NULL,
    capabilities TEXT NOT NULL,
    auth_config TEXT NOT NULL,
    schema TEXT,
    discovery_data TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
  )`,
    // Credentials table
    `CREATE TABLE credentials (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'bearer', 'basic', 'oauth')),
    encrypted_data BLOB NOT NULL,
    encryption_key_id TEXT NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    usage_count INTEGER DEFAULT 0,
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE
  )`,
    // Queries table
    `CREATE TABLE queries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    tool_id TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    parameters TEXT NOT NULL,
    operation TEXT NOT NULL,
    output_schema TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    last_executed DATETIME,
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE
  )`,
    // Collectors table
    `CREATE TABLE collectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_path TEXT NOT NULL,
    input_schema TEXT NOT NULL,
    output_schema TEXT NOT NULL,
    timeout INTEGER DEFAULT 30,
    enabled BOOLEAN DEFAULT TRUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_executed DATETIME,
    execution_count INTEGER DEFAULT 0,
    CHECK (file_path != ''),
    CHECK (timeout > 0)
  )`,
    // Executions table
    `CREATE TABLE executions (
    id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    parameters TEXT,
    collector_inputs TEXT,
    credential_refs TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    result TEXT,
    error_details TEXT,
    FOREIGN KEY(query_id) REFERENCES queries(id) ON DELETE CASCADE,
    CHECK (
        (status IN ('completed', 'failed', 'cancelled') AND completed_at IS NOT NULL) OR
        (status IN ('pending', 'running') AND completed_at IS NULL)
    )
  )`,
    // Audit log table
    `CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    user_action TEXT,
    details TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    CHECK (entity_type IN ('tool', 'query', 'credential', 'collector', 'execution', 'system'))
  )`,
    // Configuration table
    `CREATE TABLE configuration (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (category IN ('security', 'performance', 'discovery', 'logging', 'general'))
  )`,
    // Fixed interfaces table for cached MCP tool operations
    `CREATE TABLE fixed_interfaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    schema_json TEXT NOT NULL,
    parameters_json TEXT,
    response_schema_json TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_validated DATETIME,
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'deprecated')),
    performance_score REAL DEFAULT 0.0,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    average_response_time REAL DEFAULT 0.0,
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    UNIQUE(name, tool_id)
  )`,
    // OAuth configurations table
    `CREATE TABLE oauth_configurations (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT, -- encrypted
    auth_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    scopes TEXT,
    redirect_uri TEXT NOT NULL,
    pkce_enabled BOOLEAN DEFAULT TRUE,
    state_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    UNIQUE(tool_id, provider)
  )`,
    // OAuth tokens table
    `CREATE TABLE oauth_tokens (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    config_id TEXT NOT NULL,
    access_token TEXT NOT NULL, -- encrypted
    refresh_token TEXT, -- encrypted
    token_type TEXT DEFAULT 'Bearer',
    expires_at DATETIME,
    scopes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_refreshed DATETIME,
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    FOREIGN KEY(config_id) REFERENCES oauth_configurations(id) ON DELETE CASCADE
  )`,
    // Performance metrics table
    `CREATE TABLE performance_metrics (
    id TEXT PRIMARY KEY,
    interface_id TEXT,
    tool_id TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('fixed', 'dynamic', 'discovery')),
    operation_name TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_time_ms REAL NOT NULL,
    success BOOLEAN NOT NULL,
    error_details TEXT,
    parameters_hash TEXT,
    response_size INTEGER,
    cpu_time_ms REAL,
    memory_mb REAL,
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    FOREIGN KEY(interface_id) REFERENCES fixed_interfaces(id) ON DELETE CASCADE
  )`,
];
// Index creation statements
export const INDEX_STATEMENTS = [
    'CREATE INDEX idx_tools_name ON tools(name)',
    'CREATE INDEX idx_tools_status ON tools(status)',
    'CREATE INDEX idx_tools_endpoint ON tools(endpoint)',
    'CREATE INDEX idx_tools_last_checked ON tools(last_checked)',
    'CREATE INDEX idx_credentials_tool_id ON credentials(tool_id)',
    'CREATE INDEX idx_credentials_auth_type ON credentials(auth_type)',
    'CREATE INDEX idx_credentials_expires_at ON credentials(expires_at)',
    'CREATE INDEX idx_credentials_last_used ON credentials(last_used)',
    'CREATE INDEX idx_queries_tool_id ON queries(tool_id)',
    'CREATE INDEX idx_queries_name ON queries(name)',
    'CREATE INDEX idx_queries_last_executed ON queries(last_executed)',
    'CREATE INDEX idx_queries_execution_count ON queries(execution_count)',
    'CREATE INDEX idx_collectors_name ON collectors(name)',
    'CREATE INDEX idx_collectors_enabled ON collectors(enabled)',
    'CREATE INDEX idx_collectors_last_executed ON collectors(last_executed)',
    'CREATE INDEX idx_executions_query_id ON executions(query_id)',
    'CREATE INDEX idx_executions_status ON executions(status)',
    'CREATE INDEX idx_executions_started_at ON executions(started_at)',
    'CREATE INDEX idx_executions_completed_at ON executions(completed_at)',
    'CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp)',
    'CREATE INDEX idx_audit_log_event_type ON audit_log(event_type)',
    'CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type)',
    'CREATE INDEX idx_audit_log_entity_id ON audit_log(entity_id)',
    'CREATE INDEX idx_configuration_category ON configuration(category)',
    // Fixed interfaces indexes
    'CREATE INDEX idx_fixed_interfaces_tool_id ON fixed_interfaces(tool_id)',
    'CREATE INDEX idx_fixed_interfaces_name ON fixed_interfaces(name)',
    'CREATE INDEX idx_fixed_interfaces_is_active ON fixed_interfaces(is_active)',
    'CREATE INDEX idx_fixed_interfaces_validation_status ON fixed_interfaces(validation_status)',
    'CREATE INDEX idx_fixed_interfaces_performance_score ON fixed_interfaces(performance_score)',
    'CREATE INDEX idx_fixed_interfaces_last_validated ON fixed_interfaces(last_validated)',
    // OAuth indexes
    'CREATE INDEX idx_oauth_configurations_tool_id ON oauth_configurations(tool_id)',
    'CREATE INDEX idx_oauth_configurations_provider ON oauth_configurations(provider)',
    'CREATE INDEX idx_oauth_tokens_tool_id ON oauth_tokens(tool_id)',
    'CREATE INDEX idx_oauth_tokens_config_id ON oauth_tokens(config_id)',
    'CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at)',
    // Performance metrics indexes
    'CREATE INDEX idx_performance_metrics_interface_id ON performance_metrics(interface_id)',
    'CREATE INDEX idx_performance_metrics_tool_id ON performance_metrics(tool_id)',
    'CREATE INDEX idx_performance_metrics_access_type ON performance_metrics(access_type)',
    'CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp)',
    'CREATE INDEX idx_performance_metrics_success ON performance_metrics(success)',
    'CREATE INDEX idx_performance_metrics_composite ON performance_metrics(tool_id, access_type, timestamp)',
];
// Trigger creation statements
export const TRIGGER_STATEMENTS = [
    `CREATE TRIGGER update_tools_timestamp 
   AFTER UPDATE ON tools
   BEGIN
       UPDATE tools SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
    `CREATE TRIGGER update_queries_timestamp 
   AFTER UPDATE ON queries
   BEGIN
       UPDATE queries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
    `CREATE TRIGGER update_configuration_timestamp 
   AFTER UPDATE ON configuration
   BEGIN
       UPDATE configuration SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
   END`,
    `CREATE TRIGGER increment_query_execution_count
   AFTER INSERT ON executions
   WHEN NEW.status = 'completed'
   BEGIN
       UPDATE queries 
       SET 
           execution_count = execution_count + 1,
           last_executed = NEW.completed_at
       WHERE id = NEW.query_id;
   END`,
    `CREATE TRIGGER increment_collector_execution_count
   AFTER UPDATE ON collectors
   WHEN NEW.last_executed > OLD.last_executed
   BEGIN
       UPDATE collectors 
       SET execution_count = execution_count + 1 
       WHERE id = NEW.id;
   END`,
    `CREATE TRIGGER update_credential_usage
   AFTER UPDATE ON credentials
   WHEN NEW.last_used > OLD.last_used
   BEGIN
       UPDATE credentials 
       SET usage_count = usage_count + 1 
       WHERE id = NEW.id;
   END`,
    // Fixed interfaces triggers
    `CREATE TRIGGER update_fixed_interfaces_timestamp 
   AFTER UPDATE ON fixed_interfaces
   BEGIN
       UPDATE fixed_interfaces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
    `CREATE TRIGGER update_fixed_interface_performance
   AFTER UPDATE ON fixed_interfaces
   WHEN NEW.execution_count > OLD.execution_count
   BEGIN
       UPDATE fixed_interfaces 
       SET 
           success_count = CASE WHEN NEW.success_count > OLD.success_count THEN NEW.success_count ELSE OLD.success_count END,
           average_response_time = (OLD.average_response_time * OLD.execution_count + NEW.average_response_time) / NEW.execution_count,
           performance_score = (NEW.success_count * 1.0 / NEW.execution_count) * 100.0
       WHERE id = NEW.id;
   END`,
    // OAuth triggers  
    `CREATE TRIGGER update_oauth_configurations_timestamp 
   AFTER UPDATE ON oauth_configurations
   BEGIN
       UPDATE oauth_configurations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
    `CREATE TRIGGER update_oauth_tokens_refresh_timestamp
   AFTER UPDATE ON oauth_tokens
   WHEN NEW.access_token != OLD.access_token
   BEGIN
       UPDATE oauth_tokens SET last_refreshed = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
];
// View creation statements
export const VIEW_STATEMENTS = [
    `CREATE VIEW active_tools AS
   SELECT 
       id,
       name,
       version,
       description,
       endpoint,
       json_array_length(capabilities) as capability_count,
       status,
       last_checked,
       created_at
   FROM tools
   WHERE status = 'active'`,
    `CREATE VIEW recent_executions AS
   SELECT 
       e.id,
       e.query_id,
       q.name as query_name,
       t.name as tool_name,
       e.status,
       e.started_at,
       e.completed_at,
       CAST((julianday(e.completed_at) - julianday(e.started_at)) * 86400 AS REAL) as duration_seconds
   FROM executions e
   JOIN queries q ON e.query_id = q.id
   JOIN tools t ON q.tool_id = t.id
   WHERE e.started_at > datetime('now', '-7 days')
   ORDER BY e.started_at DESC`,
    `CREATE VIEW query_statistics AS
   SELECT 
       q.id,
       q.name,
       q.description,
       t.name as tool_name,
       q.execution_count,
       q.last_executed,
       q.created_at,
       COALESCE(
           CAST((julianday('now') - julianday(q.last_executed)) AS INTEGER), 
           999
       ) as days_since_last_execution
   FROM queries q
   JOIN tools t ON q.tool_id = t.id`,
    `CREATE VIEW credential_status AS
   SELECT 
       c.id,
       c.tool_id,
       t.name as tool_name,
       c.auth_type,
       CASE 
           WHEN c.expires_at IS NULL THEN 'no_expiration'
           WHEN c.expires_at > datetime('now', '+7 days') THEN 'valid'
           WHEN c.expires_at > datetime('now') THEN 'expiring_soon'
           ELSE 'expired'
       END as status,
       c.expires_at,
       c.usage_count,
       c.last_used
   FROM credentials c
   JOIN tools t ON c.tool_id = t.id`,
];
// Data insertion statements
export const INITIAL_DATA_STATEMENTS = [
    // Insert initial schema version
    `INSERT INTO schema_version (version, description) 
   VALUES ('${SCHEMA_VERSION}', 'Initial schema for MCP Tool Management System')`,
    // Insert default configuration values
    `INSERT INTO configuration (key, value, category, description) VALUES
   ('security.encryption_enabled', 'true', 'security', 'Enable encryption for credential storage'),
   ('security.key_derivation_rounds', '100000', 'security', 'Number of key derivation rounds'),
   ('security.credential_ttl', '2592000', 'security', 'Default credential TTL in seconds (30 days)'),
   ('performance.query_timeout', '30', 'performance', 'Default query timeout in seconds'),
   ('performance.max_memory_usage', '536870912', 'performance', 'Maximum memory usage in bytes (512MB)'),
   ('performance.enable_streaming', 'true', 'performance', 'Enable streaming for large responses'),
   ('discovery.cache_timeout', '3600', 'discovery', 'Tool capability cache timeout in seconds'),
   ('discovery.max_concurrency', '5', 'discovery', 'Maximum concurrent discovery operations'),
   ('discovery.retry_attempts', '3', 'discovery', 'Number of retry attempts for failed discoveries'),
   ('logging.level', '"info"', 'logging', 'Default logging level'),
   ('logging.max_file_size', '10485760', 'logging', 'Maximum log file size in bytes (10MB)'),
   ('logging.max_files', '5', 'logging', 'Maximum number of log files to retain')`,
];
// Sample data for testing
export const SAMPLE_DATA_STATEMENTS = [
    // Sample tool
    `INSERT OR IGNORE INTO tools (id, name, version, description, endpoint, capabilities, auth_config, status) VALUES
   ('notion-mcp', 'Notion MCP Server', '1.0.0', 'MCP server for Notion integration', 
    'notion://localhost:3000', '["search", "create", "update"]', '{"type": "oauth", "provider": "notion"}', 'active')`,
    // Sample fixed interface
    `INSERT OR IGNORE INTO fixed_interfaces (id, name, tool_id, display_name, description, schema_json, version, is_active) VALUES
   ('notion-search', 'search_pages', 'notion-mcp', 'Notion Page Search', 'Search pages in Notion workspace',
    '{"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "number", "default": 10}}}',
    '1.0.0', TRUE)`,
];
// All statements in order
export const ALL_SCHEMA_STATEMENTS = [
    ...SCHEMA_STATEMENTS,
    ...INDEX_STATEMENTS,
    ...TRIGGER_STATEMENTS,
    ...VIEW_STATEMENTS,
    ...INITIAL_DATA_STATEMENTS,
    ...SAMPLE_DATA_STATEMENTS,
];
