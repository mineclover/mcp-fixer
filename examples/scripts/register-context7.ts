#!/usr/bin/env bun
/**
 * Context7 MCP 서버를 수동으로 등록하는 스크립트
 * 
 * 현재 mcp-fixer에 Context7이 등록되어 있지 않으므로
 * 데이터베이스에 직접 추가하여 고정 인터페이스 데모를 가능하게 함
 */

import { Database } from 'bun:sqlite';
import { getDatabase } from '../../src/lib/database.js';

async function registerContext7() {
  console.log('Context7 MCP 서버 등록 시작...');
  
  try {
    // 데이터베이스 연결
    const dbManager = await getDatabase();
    const db = dbManager.getDatabase();
    
    // Context7 도구가 이미 존재하는지 확인
    const existingTool = db.prepare('SELECT id FROM tools WHERE id = ?').get('context7');
    
    if (existingTool) {
      console.log('✅ Context7이 이미 등록되어 있습니다.');
      return;
    }
    
    // Context7 MCP 서버 정보 준비
    const toolData = {
      id: 'context7',
      name: 'Context7 MCP Server',
      version: '1.0.0',
      description: 'Context7 documentation and library lookup server',
      endpoint: 'context7://localhost:3001', // 가상 엔드포인트
      status: 'active',
      capabilities: JSON.stringify([
        {
          name: 'resolve-library-id',
          description: 'Resolve library name to Context7-compatible library ID',
          parameters: {
            type: 'object',
            properties: {
              libraryName: {
                type: 'string',
                description: 'Library name to search for'
              }
            },
            required: ['libraryName']
          }
        },
        {
          name: 'get-library-docs',
          description: 'Fetch documentation for a library',
          parameters: {
            type: 'object',
            properties: {
              context7CompatibleLibraryID: {
                type: 'string',
                description: 'Context7-compatible library ID'
              },
              topic: {
                type: 'string',
                description: 'Topic to focus documentation on'
              },
              tokens: {
                type: 'number',
                description: 'Maximum number of tokens',
                default: 5000
              }
            },
            required: ['context7CompatibleLibraryID']
          }
        }
      ]),
      auth_config: JSON.stringify({
        required: false,
        type: 'none'
      }),
      schema: JSON.stringify({
        version: '1.0.0',
        capabilities: 2,
        demo_mode: true
      }),
      discovery_data: JSON.stringify({
        source: 'manual_registration',
        demo_mode: true,
        supported_libraries: [
          '/websites/www_tradingview_com-pine-script-docs',
          '/websites/tradingview_pine-script-docs',
          '/websites/tradingview-pine-script-docs-v5'
        ]
      }),
      last_checked: new Date().toISOString()
    };
    
    // Context7 도구 등록
    const insertTool = db.prepare(`
      INSERT INTO tools (
        id, name, version, description, endpoint, status, 
        capabilities, auth_config, schema, discovery_data, last_checked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertTool.run(
      toolData.id,
      toolData.name,
      toolData.version,
      toolData.description,
      toolData.endpoint,
      toolData.status,
      toolData.capabilities,
      toolData.auth_config,
      toolData.schema,
      toolData.discovery_data,
      toolData.last_checked
    );
    
    console.log('✅ Context7 MCP 서버가 성공적으로 등록되었습니다.');
    console.log(`   - ID: ${toolData.id}`);
    console.log(`   - Name: ${toolData.name}`);
    console.log(`   - Version: ${toolData.version}`);
    console.log(`   - Capabilities: ${JSON.parse(toolData.capabilities).length}개`);
    
    // 등록 확인
    const registeredTool = db.prepare(`
      SELECT id, name, version, status, 
             json_array_length(capabilities) as capability_count
      FROM tools 
      WHERE id = ?
    `).get('context7');
    
    if (registeredTool) {
      console.log('📊 등록 확인:');
      console.log('   ', registeredTool);
    }
    
  } catch (error) {
    console.error('❌ Context7 등록 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.main) {
  registerContext7();
}

export { registerContext7 };