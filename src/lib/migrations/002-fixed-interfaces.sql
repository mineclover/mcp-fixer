-- Database Schema Extension: MCP Fixed Interface Optimization
-- Feature: 002-claude-mcp-add
-- Date: 2025-09-10
-- Dependencies: Extends schema from 001-mcp-tool-mcp

-- Update schema version
INSERT INTO schema_version (version, description) 
VALUES ('2.0.0', 'Added fixed interface optimization, OAuth 2.0 support, and performance analytics');

-- Fixed interface specifications table
CREATE TABLE fixed_interfaces (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    schema_json TEXT NOT NULL,
    parameters_json TEXT NOT NULL,
    response_schema_json TEXT NOT NULL,
    version TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_validated DATETIME,
    validation_errors TEXT,
    
    -- Foreign key constraints
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    
    -- Unique constraints
    UNIQUE(tool_id, name),
    
    -- Check constraints
    CHECK (version GLOB '[0-9]*.[0-9]*.[0-9]*'),
    CHECK (length(name) > 0),
    CHECK (length(display_name) > 0)
);

-- OAuth configuration table
CREATE TABLE oauth_configurations (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    authorization_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    client_id TEXT NOT NULL,
    scopes TEXT, -- JSON array of scopes
    additional_params TEXT, -- JSON object for extra parameters
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    
    -- Unique constraints
    UNIQUE(tool_id, provider_name),
    
    -- Check constraints
    CHECK (authorization_url LIKE 'https://%'),
    CHECK (token_url LIKE 'https://%'),
    CHECK (length(client_id) > 0),
    CHECK (length(provider_name) > 0)
);

-- OAuth tokens table (encrypted storage)
CREATE TABLE oauth_tokens (
    id TEXT PRIMARY KEY,
    oauth_config_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type TEXT NOT NULL DEFAULT 'Bearer',
    expires_at DATETIME,
    scope TEXT, -- Actual granted scopes
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_refreshed DATETIME,
    
    -- Foreign key constraints
    FOREIGN KEY (oauth_config_id) REFERENCES oauth_configurations(id) ON DELETE CASCADE,
    
    -- Check constraints
    CHECK (length(access_token_encrypted) > 0),
    CHECK (token_type IN ('Bearer', 'Basic'))
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id TEXT PRIMARY KEY,
    interface_id TEXT, -- NULL for dynamic access metrics
    tool_id TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK(access_type IN ('fixed', 'dynamic')),
    operation_name TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_category TEXT, -- auth, network, validation, server, etc.
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON object for additional context
    
    -- Foreign key constraints
    FOREIGN KEY (interface_id) REFERENCES fixed_interfaces(id) ON DELETE SET NULL,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    
    -- Check constraints
    CHECK (response_time_ms > 0),
    CHECK (length(operation_name) > 0),
    CHECK (error_category IN ('auth', 'network', 'validation', 'server', 'timeout', 'unknown') OR error_category IS NULL)
);

-- Indexes for performance optimization
CREATE INDEX idx_fixed_interfaces_tool_id ON fixed_interfaces(tool_id);
CREATE INDEX idx_fixed_interfaces_active ON fixed_interfaces(is_active) WHERE is_active = true;
CREATE INDEX idx_fixed_interfaces_name ON fixed_interfaces(tool_id, name);

CREATE INDEX idx_oauth_configurations_tool_id ON oauth_configurations(tool_id);
CREATE INDEX idx_oauth_configurations_provider ON oauth_configurations(provider_name);

CREATE INDEX idx_oauth_tokens_config_id ON oauth_tokens(oauth_config_id);
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_performance_metrics_interface ON performance_metrics(interface_id) WHERE interface_id IS NOT NULL;
CREATE INDEX idx_performance_metrics_tool ON performance_metrics(tool_id);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_access_type ON performance_metrics(access_type);

-- Views for analytics and reporting

-- Active fixed interfaces with performance summaries
CREATE VIEW active_interfaces_summary AS
SELECT 
    fi.id,
    fi.name,
    fi.display_name,
    fi.tool_id,
    t.name as tool_name,
    fi.version,
    fi.last_validated,
    COUNT(pm.id) as total_calls,
    AVG(pm.response_time_ms) as avg_response_time,
    AVG(CASE WHEN pm.success THEN 1.0 ELSE 0.0 END) as success_rate
FROM fixed_interfaces fi
JOIN tools t ON fi.tool_id = t.id
LEFT JOIN performance_metrics pm ON fi.id = pm.interface_id 
    AND pm.timestamp >= datetime('now', '-7 days')
WHERE fi.is_active = true
GROUP BY fi.id, fi.name, fi.display_name, fi.tool_id, t.name, fi.version, fi.last_validated;

-- Performance comparison: fixed vs dynamic access
CREATE VIEW performance_comparison AS
SELECT 
    pm.tool_id,
    t.name as tool_name,
    pm.operation_name,
    pm.access_type,
    COUNT(*) as call_count,
    AVG(pm.response_time_ms) as avg_response_time,
    MIN(pm.response_time_ms) as min_response_time,
    MAX(pm.response_time_ms) as max_response_time,
    AVG(CASE WHEN pm.success THEN 1.0 ELSE 0.0 END) as success_rate
FROM performance_metrics pm
JOIN tools t ON pm.tool_id = t.id
WHERE pm.timestamp >= datetime('now', '-7 days')
GROUP BY pm.tool_id, t.name, pm.operation_name, pm.access_type;

-- OAuth token status view
CREATE VIEW oauth_token_status AS
SELECT 
    oc.tool_id,
    t.name as tool_name,
    oc.provider_name,
    ot.token_type,
    ot.expires_at,
    CASE 
        WHEN ot.expires_at IS NULL THEN 'no_expiry'
        WHEN ot.expires_at <= datetime('now') THEN 'expired'
        WHEN ot.expires_at <= datetime('now', '+1 hour') THEN 'expiring_soon'
        ELSE 'valid'
    END as token_status,
    ot.scope,
    ot.last_refreshed
FROM oauth_configurations oc
JOIN tools t ON oc.tool_id = t.id
LEFT JOIN oauth_tokens ot ON oc.id = ot.oauth_config_id;

-- Triggers for data maintenance

-- Update oauth_configurations.updated_at on changes
CREATE TRIGGER oauth_configurations_updated_at 
    AFTER UPDATE ON oauth_configurations
BEGIN
    UPDATE oauth_configurations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Clean up expired performance metrics (retain 30 days)
CREATE TRIGGER cleanup_old_performance_metrics
    AFTER INSERT ON performance_metrics
BEGIN
    DELETE FROM performance_metrics 
    WHERE timestamp < datetime('now', '-30 days');
END;

-- Clean up expired OAuth tokens (retain 90 days if unused)
CREATE TRIGGER cleanup_expired_oauth_tokens
    AFTER INSERT ON oauth_tokens
BEGIN
    DELETE FROM oauth_tokens 
    WHERE created_at < datetime('now', '-90 days')
    AND (expires_at < datetime('now', '-7 days') OR last_refreshed < datetime('now', '-90 days'));
END;

-- Validation trigger for fixed interface schemas
-- Note: Full JSON schema validation will be handled in application code
-- This trigger provides basic JSON format validation
CREATE TRIGGER validate_fixed_interface_json
    BEFORE INSERT ON fixed_interfaces
BEGIN
    -- Validate that JSON fields are parseable JSON
    SELECT CASE
        WHEN json_valid(NEW.schema_json) = 0 THEN
            RAISE(ABORT, 'schema_json must be valid JSON')
        WHEN json_valid(NEW.parameters_json) = 0 THEN  
            RAISE(ABORT, 'parameters_json must be valid JSON')
        WHEN json_valid(NEW.response_schema_json) = 0 THEN
            RAISE(ABORT, 'response_schema_json must be valid JSON')
    END;
END;

-- Validation trigger for OAuth configuration
CREATE TRIGGER validate_oauth_config_json
    BEFORE INSERT ON oauth_configurations  
BEGIN
    -- Validate optional JSON fields
    SELECT CASE
        WHEN NEW.scopes IS NOT NULL AND json_valid(NEW.scopes) = 0 THEN
            RAISE(ABORT, 'scopes must be valid JSON array')
        WHEN NEW.additional_params IS NOT NULL AND json_valid(NEW.additional_params) = 0 THEN
            RAISE(ABORT, 'additional_params must be valid JSON object')
    END;
END;

-- Add configuration values for new features
INSERT INTO configuration (key, value, category, description) VALUES
('fixed_interfaces.cache_timeout', '3600', 'performance', 'Fixed interface cache timeout in seconds'),
('fixed_interfaces.validation_interval', '86400', 'performance', 'Fixed interface validation check interval in seconds (24 hours)'),
('oauth.token_refresh_threshold', '3600', 'security', 'OAuth token refresh threshold in seconds (1 hour)'),
('oauth.max_retries', '3', 'performance', 'Maximum OAuth operation retries'),
('performance.metrics_retention_days', '30', 'logging', 'Performance metrics retention period in days'),
('performance.benchmark_target_ms', '100', 'performance', 'Target response time for fixed interfaces in milliseconds');

-- Database integrity checks
PRAGMA integrity_check;
PRAGMA foreign_key_check;

-- Analyze tables for query optimization
ANALYZE;