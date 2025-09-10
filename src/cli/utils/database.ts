import { Database } from 'bun:sqlite';
import * as path from 'path';
import * as fs from 'fs';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'mcp-tool.db');

export async function getDatabase(customPath?: string): Promise<Database> {
  const dbPath = customPath || process.env.MCP_TOOL_DB || DEFAULT_DB_PATH;
  
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');
  
  // Run migrations if needed
  await runMigrations(db);
  
  return db;
}

async function runMigrations(db: Database) {
  // Check if schema_version table exists
  const tableExists = db.query(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='schema_version'
  `).get();

  if (!tableExists) {
    // Run initial migration
    const migration001Path = path.join(__dirname, '../../lib/migrations/001-initial.sql');
    if (fs.existsSync(migration001Path)) {
      const migration001 = fs.readFileSync(migration001Path, 'utf-8');
      db.exec(migration001);
    }
  }

  // Check for 002 migration
  const version = db.query('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get() as any;
  
  if (!version || version.version < '2.0.0') {
    const migration002Path = path.join(__dirname, '../../lib/migrations/002-fixed-interfaces.sql');
    if (fs.existsSync(migration002Path)) {
      const migration002 = fs.readFileSync(migration002Path, 'utf-8');
      db.exec(migration002);
    }
  }
}