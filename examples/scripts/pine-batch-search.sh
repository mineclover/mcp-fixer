#!/bin/bash
# Pine Script 배치 검색 스크립트

cd /Users/junwoobang/project/mcp-fixer

declare -a topics=(
  "getting started first script tutorial"
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
echo "🔍 TradingView Pine Script 배치 검색 시뮬레이션..."

for i in "${!topics[@]}"; do
  topic="${topics[$i]}"
  echo "[$((i+1))/${#topics[@]}] 검색 중: $topic"
  
  # 모의 검색 결과 생성
  cat > "examples/results/$(printf "%02d" $((i+1)))-$(echo "$topic" | tr ' ' '_' | head -c 30).json" << EOJ
{
  "success": true,
  "responseTime": $((50 + RANDOM % 200)),
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "data": {
    "documentation": "Pine Script documentation for: $topic",
    "codeSnippets": [
      {
        "title": "Example for $topic",
        "language": "Pine Script",
        "code": "@version=6\\nindicator(\\\"Demo\\\")\\n// Code for $topic",
        "source": "https://www.tradingview.com/pine-script-docs/"
      }
    ],
    "metadata": {
      "totalSnippets": 1,
      "topic": "$topic"
    }
  },
  "interfaceName": "tradingview-pinescript-search",
  "cached": $(if [ $((RANDOM % 2)) -eq 0 ]; then echo "true"; else echo "false"; fi)
}
EOJ
  
  echo "  ✓ 완료 ($(if [ $((RANDOM % 2)) -eq 0 ]; then echo "캐시적용"; else echo "신규검색"; fi))"
  sleep 0.1
done

echo ""
echo "📊 배치 검색 완료 - 결과 파일:"
ls -la examples/results/ | grep -E '\.(json)$' | wc -l | xargs printf "   총 %s개 파일 생성\n"
