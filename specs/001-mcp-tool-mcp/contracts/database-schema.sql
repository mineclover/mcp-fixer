-- MCP Tool Management Database Schema
-- SQLite Database for local-first storage
-- Date: 2025-09-09

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Version tracking table
CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert initial schema version
INSERT INTO schema_version (version, description) 
VALUES ('1.0.0', 'Initial schema for MCP Tool Management System');

-- Tools table - stores discovered MCP tool information
CREATE TABLE tools (
    id TEXT PRIMARY KEY,  -- UUID
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    endpoint TEXT NOT NULL,
    capabilities TEXT NOT NULL,  -- JSON array of tool capabilities
    auth_config TEXT NOT NULL,   -- JSON object with auth requirements
    schema TEXT,                 -- JSON object with tool schemas
    discovery_data TEXT,         -- JSON object with additional discovery metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique tool name+version combinations
    UNIQUE(name, version)
);

-- Credentials table - encrypted storage for authentication data
CREATE TABLE credentials (
    id TEXT PRIMARY KEY,  -- UUID
    tool_id TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'bearer', 'basic', 'oauth')),
    encrypted_data BLOB NOT NULL,     -- AES-256 encrypted credential data
    encryption_key_id TEXT NOT NULL,  -- Reference to encryption key
    expires_at DATETIME,              -- Optional expiration date
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    usage_count INTEGER DEFAULT 0,
    
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE
);

-- Queries table - reusable query templates
CREATE TABLE queries (
    id TEXT PRIMARY KEY,  -- UUID
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    tool_id TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    parameters TEXT NOT NULL,      -- JSON schema for input parameters
    operation TEXT NOT NULL,       -- JSON object describing MCP operation
    output_schema TEXT,            -- JSON schema for expected output
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    last_executed DATETIME,
    
    FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE
);

-- Data collectors table - custom data collection modules
CREATE TABLE collectors (
    id TEXT PRIMARY KEY,  -- UUID
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_path TEXT NOT NULL,
    input_schema TEXT NOT NULL,    -- JSON schema for input parameters
    output_schema TEXT NOT NULL,   -- JSON schema for output data
    timeout INTEGER DEFAULT 30,   -- Execution timeout in seconds
    enabled BOOLEAN DEFAULT TRUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_executed DATETIME,
    execution_count INTEGER DEFAULT 0,
    
    -- Ensure collector file exists and is accessible
    CHECK (file_path != ''),
    CHECK (timeout > 0)
);

-- Execution contexts table - runtime execution tracking
CREATE TABLE executions (
    id TEXT PRIMARY KEY,  -- UUID
    query_id TEXT NOT NULL,
    parameters TEXT,           -- JSON object with runtime parameters
    collector_inputs TEXT,     -- JSON object with data collector results
    credential_refs TEXT,      -- JSON array with credential references
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    result TEXT,              -- JSON object with execution result
    error_details TEXT,       -- JSON object with error information
    
    FOREIGN KEY(query_id) REFERENCES queries(id) ON DELETE CASCADE,
    
    -- Ensure completed executions have completion time
    CHECK (
        (status IN ('completed', 'failed', 'cancelled') AND completed_at IS NOT NULL) OR
        (status IN ('pending', 'running') AND completed_at IS NULL)
    )
);

-- Audit log table - track system activities
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,  -- e.g., 'tool_discovered', 'query_executed', 'credential_accessed'
    entity_type TEXT NOT NULL, -- e.g., 'tool', 'query', 'credential', 'collector'
    entity_id TEXT,            -- Reference to affected entity
    user_action TEXT,          -- User-initiated action that triggered event
    details TEXT,              -- JSON object with additional event details
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    
    CHECK (entity_type IN ('tool', 'query', 'credential', 'collector', 'execution', 'system'))
);

-- Configuration table - system configuration storage
CREATE TABLE configuration (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,       -- JSON value
    category TEXT NOT NULL,    -- e.g., 'security', 'performance', 'discovery'
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (category IN ('security', 'performance', 'discovery', 'logging', 'general'))
);

-- Performance indexes for query optimization
CREATE INDEX idx_tools_name ON tools(name);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_endpoint ON tools(endpoint);
CREATE INDEX idx_tools_last_checked ON tools(last_checked);

CREATE INDEX idx_credentials_tool_id ON credentials(tool_id);
CREATE INDEX idx_credentials_auth_type ON credentials(auth_type);
CREATE INDEX idx_credentials_expires_at ON credentials(expires_at);
CREATE INDEX idx_credentials_last_used ON credentials(last_used);

CREATE INDEX idx_queries_tool_id ON queries(tool_id);
CREATE INDEX idx_queries_name ON queries(name);
CREATE INDEX idx_queries_last_executed ON queries(last_executed);
CREATE INDEX idx_queries_execution_count ON queries(execution_count);

CREATE INDEX idx_collectors_name ON collectors(name);
CREATE INDEX idx_collectors_enabled ON collectors(enabled);
CREATE INDEX idx_collectors_last_executed ON collectors(last_executed);

CREATE INDEX idx_executions_query_id ON executions(query_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at);
CREATE INDEX idx_executions_completed_at ON executions(completed_at);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_entity_id ON audit_log(entity_id);

CREATE INDEX idx_configuration_category ON configuration(category);

-- Database triggers for automatic timestamp updates
CREATE TRIGGER update_tools_timestamp 
AFTER UPDATE ON tools
BEGIN
    UPDATE tools SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_queries_timestamp 
AFTER UPDATE ON queries
BEGIN
    UPDATE queries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_configuration_timestamp 
AFTER UPDATE ON configuration
BEGIN
    UPDATE configuration SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- Trigger to increment query execution count
CREATE TRIGGER increment_query_execution_count
AFTER INSERT ON executions
WHEN NEW.status = 'completed'
BEGIN
    UPDATE queries 
    SET 
        execution_count = execution_count + 1,
        last_executed = NEW.completed_at
    WHERE id = NEW.query_id;
END;

-- Trigger to increment collector execution count
CREATE TRIGGER increment_collector_execution_count
AFTER UPDATE ON collectors
WHEN NEW.last_executed > OLD.last_executed
BEGIN
    UPDATE collectors 
    SET execution_count = execution_count + 1 
    WHERE id = NEW.id;
END;

-- Trigger to update credential usage statistics
CREATE TRIGGER update_credential_usage
AFTER UPDATE ON credentials
WHEN NEW.last_used > OLD.last_used
BEGIN
    UPDATE credentials 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.id;
END;

-- Views for common queries
CREATE VIEW active_tools AS
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
WHERE status = 'active';

CREATE VIEW recent_executions AS
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
ORDER BY e.started_at DESC;

CREATE VIEW query_statistics AS
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
JOIN tools t ON q.tool_id = t.id;

CREATE VIEW credential_status AS
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
JOIN tools t ON c.tool_id = t.id;

-- Insert default configuration values
INSERT INTO configuration (key, value, category, description) VALUES
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
('logging.max_files', '5', 'logging', 'Maximum number of log files to retain');

-- Database integrity checks
PRAGMA integrity_check;
PRAGMA foreign_key_check;

-- Analyze tables for query optimization
ANALYZE;