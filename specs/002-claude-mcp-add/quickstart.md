# Quickstart: MCP Fixed Interface Optimization

**Feature**: 002-claude-mcp-add  
**Date**: 2025-09-10  
**Prerequisites**: Working mcp-tool from 001-mcp-tool-mcp feature

## Overview

This guide demonstrates the MCP fixed interface optimization system using Context7 and Notion as test cases. You'll learn to register frequently-used MCP operations as fixed interfaces for faster access.

## Test Scenario 1: Context7 Documentation Search

### Prerequisites
- Context7 MCP server configured and accessible
- Valid API credentials for Context7

### Step 1: Register Context7 Tool (if not already done)
```bash
# Register Context7 as an MCP tool
mcp-tool discover --transport http https://mcp.context7.com/mcp
mcp-tool tools list
# Verify context7 appears in tools list
```

### Step 2: Test Dynamic Discovery (Baseline)
```bash
# Perform a dynamic documentation search (slower baseline)
time mcp-tool query create search-test --tool context7
mcp-tool query run search-test --params '{"query": "React hooks", "limit": 5}'
# Note the response time (should be >500ms for dynamic discovery)
```

### Step 3: Register Fixed Interface
```bash
# Register the search operation as a fixed interface
mcp-tool fixed register context7 search_documentation --name search-docs \
  --description "Fast documentation search interface"
  
# Verify registration
mcp-tool fixed list
```

### Step 4: Use Fixed Interface (Optimized)
```bash
# Use the fixed interface for same search (should be <100ms)
time mcp-tool fixed use search-docs --params '{"query": "React hooks", "limit": 5}'

# Compare performance
mcp-tool fixed stats search-docs --compare-dynamic
```

**Expected Results**:
- Fixed interface access: <100ms response time
- 50-75% performance improvement over dynamic discovery
- Identical search results between fixed and dynamic methods

## Test Scenario 2: Notion OAuth Integration

### Prerequisites  
- Notion MCP server configured and accessible
- Notion integration app created (for OAuth)

### Step 1: Configure OAuth for Notion
```bash
# Configure OAuth settings for Notion tool
mcp-tool fixed auth notion
# This will:
# 1. Open browser for OAuth authorization
# 2. Handle the callback and token exchange  
# 3. Store encrypted tokens securely
```

**OAuth Flow Walkthrough**:
1. Command opens browser to Notion authorization page
2. User grants permissions to the integration
3. Browser redirects to local callback (localhost:3000)
4. System exchanges authorization code for tokens
5. Tokens encrypted and stored in database

### Step 2: Register Notion Fixed Interfaces
```bash
# Register page creation as fixed interface
mcp-tool fixed register notion create_page --name create-page \
  --description "Quick page creation with OAuth"

# Register page search interface
mcp-tool fixed register notion search_pages --name search-pages \
  --description "Fast page search interface"

# Verify OAuth-enabled interfaces
mcp-tool fixed list --tool notion
```

### Step 3: Use OAuth-Enabled Fixed Interfaces
```bash
# Create a new page using fixed interface (OAuth handled automatically)
mcp-tool fixed use create-page --params '{
  "properties": {
    "title": [{"text": {"content": "Test Page from Fixed Interface"}}]
  },
  "children": [
    {
      "object": "block",
      "type": "paragraph", 
      "paragraph": {
        "rich_text": [{"text": {"content": "Created via MCP fixed interface"}}]
      }
    }
  ]
}'

# Search for pages (OAuth authentication seamless)
mcp-tool fixed use search-pages --params '{"query": "Test Page"}'
```

**Expected Results**:
- OAuth authentication handled transparently
- No re-authentication required for subsequent calls
- Fast page operations using fixed interfaces
- Proper error handling if tokens expire

## Test Scenario 3: Interface Validation & Updates

### Step 1: Test Interface Validation
```bash
# Validate all fixed interfaces against live servers
mcp-tool fixed test search-docs --verbose
mcp-tool fixed test create-page --verbose

# Check validation results
mcp-tool fixed list --include-performance
```

### Step 2: Handle Interface Changes
```bash
# Simulate interface schema change detection
mcp-tool fixed test search-docs --update-spec
# Should detect if Context7 has updated their search interface

# Manual interface update if needed
mcp-tool fixed register context7 search_documentation --name search-docs --force
# Force re-registration with latest schema
```

### Step 3: Performance Analytics
```bash
# View comprehensive performance analytics
mcp-tool fixed stats --days 1 --compare-dynamic

# Export analytics for analysis
mcp-tool fixed stats --format csv > fixed_interface_performance.csv
```

**Expected Results**:
- Interface validation detects schema changes
- Performance metrics show consistent improvement
- Analytics demonstrate fixed vs dynamic performance differences

## Test Scenario 4: Error Handling & Recovery

### Step 1: Network Error Handling
```bash
# Test behavior when MCP server is unreachable
# (temporarily block network access to test server)
mcp-tool fixed use search-docs --params '{"query": "test"}'
# Should fall back to error message, not crash
```

### Step 2: Authentication Error Handling  
```bash
# Test OAuth token expiry handling
# (manually expire tokens in database or wait for natural expiry)
mcp-tool fixed use create-page --params '{"properties": {"title": [{"text": {"content": "Test"}}]}}'
# Should automatically refresh tokens or prompt for re-authentication
```

### Step 3: Invalid Interface Handling
```bash
# Test with malformed parameters
mcp-tool fixed use search-docs --params '{"invalid": "parameter"}'
# Should return validation error with clear message

# Test with non-existent interface
mcp-tool fixed use non-existent-interface
# Should return helpful error message
```

**Expected Results**:
- Graceful error handling for all failure scenarios
- Clear error messages with suggested actions
- Automatic recovery where possible (token refresh, fallback to dynamic)

## Validation Checklist

After completing all test scenarios, verify:

### Functional Requirements
- [ ] Fixed interfaces registered successfully for both Context7 and Notion
- [ ] OAuth authentication flow completed without manual intervention
- [ ] Fixed interface access consistently faster than dynamic discovery
- [ ] Interface validation detects and handles schema changes
- [ ] Performance analytics show meaningful improvement metrics

### Performance Requirements  
- [ ] Fixed interface access <100ms (target <50ms)
- [ ] OAuth token operations <500ms
- [ ] Interface validation <1s
- [ ] Performance improvement >50% over dynamic discovery

### Security Requirements
- [ ] OAuth tokens encrypted at rest
- [ ] No sensitive data in logs or error messages
- [ ] Token refresh handled automatically
- [ ] Secure cleanup of expired credentials

### Error Handling
- [ ] Network failures handled gracefully
- [ ] Authentication errors prompt appropriate action
- [ ] Parameter validation provides clear feedback
- [ ] Fallback to dynamic discovery works when fixed interfaces fail

## Troubleshooting

### Common Issues

**Fixed Interface Not Found**
```bash
# List all registered interfaces
mcp-tool fixed list
# Re-register if missing
mcp-tool fixed register <tool-id> <operation-name> --name <interface-name>
```

**OAuth Authentication Failed**
```bash
# Re-run OAuth flow
mcp-tool fixed auth <tool-id> --reauth
# Check OAuth configuration
mcp-tool tools list --show-auth
```

**Performance Not Improved**
```bash
# Check interface cache status
mcp-tool fixed stats --verbose
# Validate interface specifications
mcp-tool fixed test <interface-name> --verbose
```

### Debug Mode
```bash
# Enable verbose logging for debugging
export MCP_TOOL_DEBUG=true
mcp-tool fixed use <interface-name> --params '{}' --verbose
```

## Next Steps

After successful quickstart completion:

1. **Register Common Interfaces**: Identify and register your most frequently-used MCP operations
2. **Monitor Performance**: Set up regular analytics reviews to optimize interface usage
3. **Automate Validation**: Schedule periodic interface validation to catch schema changes
4. **Scale Configuration**: Configure additional MCP servers with fixed interfaces

---

**Status**: Complete ✓  
**Estimated Time**: 30-45 minutes for complete quickstart
**Dependencies**: Context7 access, Notion developer account for OAuth testing