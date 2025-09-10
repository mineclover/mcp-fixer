import { beforeEach, afterEach } from 'bun:test';
import { unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
// Test database path
export const TEST_DB_PATH = join(process.cwd(), 'tests', 'test.db');
export const TEST_DATA_DIR = join(process.cwd(), 'tests', 'data');
// Clean up test database before each test
beforeEach(() => {
    // Ensure test data directory exists
    if (!existsSync(TEST_DATA_DIR)) {
        mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
    // Remove test database if it exists
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
    }
});
// Clean up after each test
afterEach(() => {
    // Remove test database if it exists
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
    }
});
// Mock environment variables for testing
process.env.MCP_TOOL_DATA_DIR = TEST_DATA_DIR;
process.env.MCP_DB_PATH = TEST_DB_PATH;
process.env.MCP_LOG_LEVEL = 'error'; // Reduce noise in tests
