# TradingView Pine Script 문서 고정 검색 가이드

Context7에서 TradingView Pine Script 문서를 고정 인터페이스로 설정하여 반복 사용하는 방법입니다.

## 개요

mcp-fixer 도구의 고정 인터페이스 기능을 사용하여 Context7의 `www_tradingview_com-pine-script-docs` 라이브러리 검색을 고정하고, 쿼리만 변경하여 빠른 문서 검색을 수행할 수 있습니다.

## 초기 설정

### 1. mcp-fixer 초기화

```bash
# 프로젝트 디렉토리에서 mcp-fixer 초기화
mcp-tool init

# 상태 확인
mcp-tool status
```

### 2. Context7 도구 발견 및 등록

```bash
# Context7 MCP 서버 발견 (예시 엔드포인트)
mcp-tool discover context7-server

# 등록된 도구 목록 확인
mcp-tool tools
```

## 고정 인터페이스 등록

### 1. TradingView Pine Script 검색 인터페이스 등록

```bash
# 고정 인터페이스 등록
mcp-tool fixed register context7 get-library-docs \
  --name "TradingView Pine Script 검색" \
  --description "TradingView Pine Script 문서 전용 검색" \
  --parameters '{
    "type": "object",
    "properties": {
      "context7CompatibleLibraryID": {
        "type": "string",
        "const": "/www_tradingview_com-pine-script-docs"
      },
      "topic": {
        "type": "string",
        "description": "검색할 주제나 키워드"
      },
      "tokens": {
        "type": "number",
        "default": 5000,
        "description": "최대 토큰 수"
      }
    },
    "required": ["context7CompatibleLibraryID", "topic"]
  }' \
  --response-schema '{
    "type": "object",
    "properties": {
      "documentation": {"type": "string"},
      "examples": {"type": "array"},
      "metadata": {"type": "object"}
    }
  }' \
  --version "1.0.0"
```

### 2. 등록 확인

```bash
# 등록된 고정 인터페이스 목록 확인
mcp-tool fixed list

# 특정 도구의 인터페이스만 확인
mcp-tool fixed list context7
```

## 사용 방법

### 1. 기본 사용법

```bash
# Pine Script 관련 주제 검색
mcp-tool fixed use get-library-docs '{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "strategy functions"
}'

# 더 많은 토큰으로 검색
mcp-tool fixed use get-library-docs '{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "plot and color",
  "tokens": 8000
}'
```

### 2. 파일을 통한 파라미터 전달

먼저 파라미터 파일을 생성합니다:

```bash
# pine-search-params.json 파일 생성
cat > pine-search-params.json << EOF
{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "indicators and overlays",
  "tokens": 6000
}
EOF

# 파일을 통한 실행
mcp-tool fixed use get-library-docs --params-file pine-search-params.json
```

### 3. 성능 모니터링과 함께 실행

```bash
# 성능 메트릭과 함께 실행
mcp-tool fixed use get-library-docs '{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "array functions"
}' --show-performance --validate-response
```

## 자주 사용하는 Pine Script 검색 주제

### 1. 미리 정의된 검색 스크립트 작성

```bash
#!/bin/bash
# pine-search.sh - Pine Script 검색 스크립트

TOPIC="$1"
TOKENS="${2:-5000}"

if [ -z "$TOPIC" ]; then
  echo "사용법: $0 <검색주제> [토큰수]"
  echo "예시: $0 'strategy functions' 6000"
  exit 1
fi

mcp-tool fixed use get-library-docs "{
  \"context7CompatibleLibraryID\": \"/www_tradingview_com-pine-script-docs\",
  \"topic\": \"$TOPIC\",
  \"tokens\": $TOKENS
}" --show-performance
```

### 2. 일반적인 검색 주제들

```bash
# 스크립트에 실행 권한 부여
chmod +x pine-search.sh

# 다양한 주제로 검색
./pine-search.sh "strategy functions"
./pine-search.sh "plot and drawing"
./pine-search.sh "array and matrix"
./pine-search.sh "time functions"
./pine-search.sh "mathematical functions"
./pine-search.sh "ta functions"
./pine-search.sh "request functions"
./pine-search.sh "alerts and notifications"
```

## 성능 최적화 및 모니터링

### 1. 인터페이스 테스트

```bash
# 인터페이스 연결성 테스트
mcp-tool fixed test get-library-docs --test-connectivity

# 성능 벤치마크 실행
mcp-tool fixed test get-library-docs --benchmark

# 종합 테스트
mcp-tool fixed test get-library-docs --comprehensive
```

### 2. 성능 통계 확인

```bash
# 성능 통계 확인
mcp-tool fixed stats get-library-docs

# 상세 성능 분석
mcp-tool fixed stats get-library-docs --detailed --period 7d

# 성능 트렌드 확인
mcp-tool fixed stats get-library-docs --trend --compare
```

### 3. 성능 보고서 생성

```bash
# CSV 형태로 성능 데이터 내보내기
mcp-tool fixed stats get-library-docs --export-csv pine-script-performance.csv

# 종합 성능 보고서 생성
mcp-tool fixed stats get-library-docs --generate-report pine-script-report.html
```

## 인증 설정 (필요한 경우)

Context7가 OAuth 인증을 요구하는 경우:

```bash
# OAuth 로그인 플로우 시작
mcp-tool fixed auth context7 --login

# 인증 상태 테스트
mcp-tool fixed auth context7 --test

# 토큰 새로고침
mcp-tool fixed auth context7 --refresh
```

## 고급 사용법

### 1. JSON 출력으로 프로그래밍 방식 사용

```bash
# JSON 형태로 결과 받기
mcp-tool fixed use get-library-docs '{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "strategy functions"
}' --output json | jq '.data.documentation'
```

### 2. 배치 스크립트로 여러 주제 검색

```bash
#!/bin/bash
# batch-pine-search.sh

topics=(
  "strategy functions"
  "plot functions"  
  "array functions"
  "ta functions"
  "request functions"
)

for topic in "${topics[@]}"; do
  echo "검색 중: $topic"
  mcp-tool fixed use get-library-docs "{
    \"context7CompatibleLibraryID\": \"/www_tradingview_com-pine-script-docs\",
    \"topic\": \"$topic\"
  }" --output json > "results_${topic// /_}.json"
  echo "완료: results_${topic// /_}.json"
done
```

### 3. 캐시된 결과 활용

고정 인터페이스는 자동으로 결과를 캐시하므로 동일한 검색은 훨씬 빠르게 실행됩니다:

```bash
# 첫 번째 실행 (느림)
time mcp-tool fixed use get-library-docs '{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "strategy functions"
}'

# 두 번째 실행 (빠름 - 캐시된 결과)
time mcp-tool fixed use get-library-docs '{
  "context7CompatibleLibraryID": "/www_tradingview_com-pine-script-docs",
  "topic": "strategy functions"
}'
```

## 문제 해결

### 1. 인터페이스가 작동하지 않는 경우

```bash
# 인터페이스 상태 확인
mcp-tool fixed list --show-validation

# 연결성 테스트
mcp-tool fixed test get-library-docs --test-connectivity

# Context7 도구 상태 확인
mcp-tool tools context7
```

### 2. 성능이 느린 경우

```bash
# 성능 분석
mcp-tool fixed stats get-library-docs --detailed

# 벤치마크 비교
mcp-tool fixed test get-library-docs --compare-performance
```

### 3. 인증 문제

```bash
# 인증 상태 확인
mcp-tool fixed auth context7 --test

# OAuth 설정 검증
mcp-tool fixed auth context7 --validate
```

## 결론

이 가이드를 통해 Context7의 TradingView Pine Script 문서를 고정 인터페이스로 설정하고, 효율적으로 반복 검색을 수행할 수 있습니다. 고정 인터페이스를 사용하면 검색 시간이 단축되고, 캐싱을 통해 성능이 향상됩니다.