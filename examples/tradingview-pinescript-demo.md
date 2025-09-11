# TradingView Pine Script 고정 인터페이스 실습 예제

Context7의 TradingView Pine Script 문서를 고정 인터페이스로 설정하여 반복 사용하는 실습 가이드입니다.

## 전제 조건

- mcp-fixer가 초기화되어 있어야 함
- Context7 MCP 서버 접근 권한 필요
- Bun runtime 설치 필요

## 실습 단계

### 1단계: 시스템 초기화 및 상태 확인

```bash
# mcp-fixer 상태 확인
cd /Users/junwoobang/project/mcp-fixer
bun run src/cli/index.ts status

# 현재 등록된 도구 확인
bun run src/cli/index.ts tools
```

### 2단계: Context7 MCP 서버 수동 등록

현재 시스템에 Context7이 등록되어 있지 않으므로 수동으로 등록해야 합니다.

```bash
# Context7 도구를 데이터베이스에 직접 추가
bun run examples/scripts/register-context7.ts
```

### 3단계: TradingView Pine Script 고정 인터페이스 등록

```bash
# Pine Script 검색 전용 고정 인터페이스 등록
bun run src/cli/index.ts fixed register context7 get-library-docs \
  --name "tradingview-pinescript-search" \
  --description "TradingView Pine Script 문서 전용 고정 검색 인터페이스" \
  --parameters '{
    "type": "object",
    "properties": {
      "context7CompatibleLibraryID": {
        "type": "string",
        "const": "/websites/www_tradingview_com-pine-script-docs"
      },
      "topic": {
        "type": "string",
        "description": "검색할 주제나 키워드"
      },
      "tokens": {
        "type": "number",
        "default": 5000,
        "minimum": 1000,
        "maximum": 10000
      }
    },
    "required": ["context7CompatibleLibraryID", "topic"]
  }' \
  --response-schema '{
    "type": "object",
    "properties": {
      "documentation": {"type": "string"},
      "codeSnippets": {"type": "array"},
      "metadata": {"type": "object"}
    }
  }' \
  --version "1.0.0"
```

### 4단계: 등록 확인

```bash
# 고정 인터페이스 목록 확인
bun run src/cli/index.ts fixed list

# 특정 도구의 인터페이스만 확인
bun run src/cli/index.ts fixed list context7
```

### 5단계: 기본 검색 테스트

```bash
# Pine Script 처음 시작하기 검색
bun run src/cli/index.ts fixed use tradingview-pinescript-search '{
  "topic": "getting started first script beginners tutorial"
}'

# 변수와 연산자 검색
bun run src/cli/index.ts fixed use tradingview-pinescript-search '{
  "topic": "variables and operators basic syntax",
  "tokens": 6000
}'
```

### 6단계: 파일 기반 검색 테스트

```bash
# 검색 파라미터 파일 생성
mkdir -p examples/searches
cat > examples/searches/pine-beginner.json << 'EOF'
{
  "topic": "first script getting started tutorial basic syntax indicators",
  "tokens": 6000
}
EOF

cat > examples/searches/pine-arrays.json << 'EOF'
{
  "topic": "arrays for loops iteration matrix operations",
  "tokens": 7000
}
EOF

cat > examples/searches/pine-strategies.json << 'EOF'
{
  "topic": "strategy functions buy sell signals backtesting",
  "tokens": 8000
}
EOF

# 파일을 통한 검색 실행
bun run src/cli/index.ts fixed use tradingview-pinescript-search --params-file examples/searches/pine-beginner.json

bun run src/cli/index.ts fixed use tradingview-pinescript-search --params-file examples/searches/pine-arrays.json

bun run src/cli/index.ts fixed use tradingview-pinescript-search --params-file examples/searches/pine-strategies.json
```

### 7단계: 배치 검색 스크립트

```bash
# 배치 검색 스크립트 생성
cat > examples/scripts/pine-batch-search.sh << 'EOF'
#!/bin/bash
# Pine Script 배치 검색 스크립트

cd /Users/junwoobang/project/mcp-fixer

declare -a topics=(
  "getting started tutorial first script"
  "variables operators conditional statements" 
  "loops for while iteration"
  "arrays matrices data structures"
  "plotting visualization chart elements"
  "strategy development backtesting"
  "indicators overlays technical analysis"
  "time functions sessions market hours"
  "debugging optimization performance"
  "advanced features custom functions"
)

mkdir -p examples/results
echo "TradingView Pine Script 배치 검색 시작..."

for i in "${!topics[@]}"; do
  topic="${topics[$i]}"
  echo "[$((i+1))/${#topics[@]}] 검색 중: $topic"
  
  bun run src/cli/index.ts fixed use tradingview-pinescript-search "{
    \"topic\": \"$topic\",
    \"tokens\": 6000
  }" --output json > "examples/results/$(printf "%02d" $((i+1)))-$(echo "$topic" | tr ' ' '_' | head -c 30).json" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "  ✓ 완료"
  else
    echo "  ✗ 실패"
  fi
  
  sleep 1  # API 호출 간격 조절
done

echo "배치 검색 완료. 결과 파일: examples/results/"
ls -la examples/results/
EOF

chmod +x examples/scripts/pine-batch-search.sh

# 배치 검색 실행
./examples/scripts/pine-batch-search.sh
```

### 8단계: 성능 모니터링

```bash
# 인터페이스 성능 통계 확인
bun run src/cli/index.ts fixed stats tradingview-pinescript-search

# 상세 성능 분석
bun run src/cli/index.ts fixed stats tradingview-pinescript-search --detailed --period 7d

# 연결성 테스트
bun run src/cli/index.ts fixed test tradingview-pinescript-search --test-connectivity

# 종합 테스트
bun run src/cli/index.ts fixed test tradingview-pinescript-search --comprehensive
```

### 9단계: 결과 분석 및 활용

```bash
# 검색 결과 JSON 파일 분석 스크립트
cat > examples/scripts/analyze-results.ts << 'EOF'
#!/usr/bin/env bun
// 검색 결과 분석 스크립트

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const resultsDir = 'examples/results';

try {
  const files = await readdir(resultsDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`분석할 파일 수: ${jsonFiles.length}\n`);
  
  for (const file of jsonFiles.sort()) {
    try {
      const content = await readFile(join(resultsDir, file), 'utf8');
      const data = JSON.parse(content);
      
      console.log(`📄 ${file}`);
      console.log(`   성공: ${data.success ? '✅' : '❌'}`);
      console.log(`   응답시간: ${data.responseTime || 'N/A'}ms`);
      console.log(`   데이터 크기: ${data.data ? JSON.stringify(data.data).length : 0} bytes`);
      
      if (data.data && data.data.codeSnippets) {
        console.log(`   코드 예제 수: ${data.data.codeSnippets.length}`);
      }
      
      console.log('');
    } catch (e) {
      console.log(`❌ ${file}: 파싱 오류`);
    }
  }
} catch (error) {
  console.error('분석 중 오류:', error);
}
EOF

chmod +x examples/scripts/analyze-results.ts

# 결과 분석 실행
bun run examples/scripts/analyze-results.ts
```

### 10단계: 고급 사용법

```bash
# JSON 출력으로 프로그래밍 방식 사용
bun run src/cli/index.ts fixed use tradingview-pinescript-search '{
  "topic": "strategy functions"
}' --output json | bun run -e "
const data = JSON.parse(await Bun.stdin.text());
if (data.success && data.data && data.data.codeSnippets) {
  console.log('코드 예제 개수:', data.data.codeSnippets.length);
  data.data.codeSnippets.slice(0, 3).forEach((snippet, i) => {
    console.log(\`\${i+1}. \${snippet.title}\`);
  });
} else {
  console.log('검색 실패 또는 데이터 없음');
}
"

# 성능 비교 (고정 vs 동적)
echo "고정 인터페이스 성능 테스트..."
time bun run src/cli/index.ts fixed use tradingview-pinescript-search '{
  "topic": "strategy functions"
}' > /dev/null

echo "두 번째 실행 (캐시 확인)..."
time bun run src/cli/index.ts fixed use tradingview-pinescript-search '{
  "topic": "strategy functions"
}' > /dev/null
```

## 예상 결과

### 첫 번째 검색 (캐시 미적용)
- 응답 시간: 2-5초
- Context7 MCP 서버 호출 발생
- 결과가 캐시에 저장됨

### 두 번째 동일 검색 (캐시 적용)
- 응답 시간: 50-200ms
- 로컬 데이터베이스에서 즉시 응답
- 20-100배 성능 향상

### 배치 검색 결과
- 10개 주제에 대한 Pine Script 문서 검색
- JSON 형태로 결과 저장
- 코드 예제와 문서 내용 포함

## 문제 해결

### Context7 연결 실패
```bash
# 도구 상태 확인
bun run src/cli/index.ts tools

# 인터페이스 연결 테스트
bun run src/cli/index.ts fixed test tradingview-pinescript-search --test-connectivity
```

### 고정 인터페이스 등록 실패
```bash
# 등록된 인터페이스 확인
bun run src/cli/index.ts fixed list

# 강제 재등록
bun run src/cli/index.ts fixed register context7 get-library-docs --force --name "tradingview-pinescript-search"
```

### 검색 실패
```bash
# 파라미터 검증
bun run src/cli/index.ts fixed test tradingview-pinescript-search --validate-schema

# 상세 오류 정보 확인
bun run src/cli/index.ts fixed use tradingview-pinescript-search '{"topic": "test"}' --verbose
```

이 실습을 통해 Context7의 TradingView Pine Script 문서 검색을 고정 인터페이스로 설정하고 효율적으로 반복 사용하는 방법을 학습할 수 있습니다.