#!/bin/bash
# Linketry v0.29.20+optimization 部署脚本
# 使用前请仔细阅读 DEPLOYMENT_READINESS_REPORT.md

set -e  # 遇到错误立即退出

echo "🚀 Linketry v0.29.20+optimization 部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 已安装${NC}"
}

# 步骤 0: 环境检查
echo "📋 步骤 0: 环境检查"
echo "-------------------"
check_command npm
check_command wrangler
check_command curl
echo ""

# 步骤 1: 备份提醒
echo "⚠️  步骤 1: 数据库备份（必须！）"
echo "--------------------------------"
echo -e "${YELLOW}请确认已创建数据库备份！${NC}"
echo ""
echo "方法 1: 在 Admin 面板"
echo "  Settings → Backups → Create Backup"
echo ""
echo "方法 2: 通过 API"
echo "  curl -X POST -H \"Authorization: Bearer <token>\" \\"
echo "    https://go.example.com/api/v1/backups"
echo ""
read -p "已创建备份？(yes/no): " backup_confirm
if [ "$backup_confirm" != "yes" ]; then
    echo -e "${RED}请先创建备份再继续！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 已确认备份${NC}"
echo ""

# 步骤 2: 应用数据库迁移
echo "🗄️  步骤 2: 应用数据库迁移"
echo "---------------------------"
echo "正在应用性能索引迁移..."
npm run db:migrate:remote --workspace=apps/worker

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据库迁移成功${NC}"
else
    echo -e "${RED}✗ 数据库迁移失败${NC}"
    exit 1
fi
echo ""

# 步骤 3: 验证索引创建
echo "🔍 步骤 3: 验证索引创建"
echo "----------------------"
echo "检查新创建的索引..."
wrangler d1 execute DB --remote --command \
  "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'" \
  > /tmp/linketry_indexes.txt

INDEX_COUNT=$(wc -l < /tmp/linketry_indexes.txt)
if [ $INDEX_COUNT -ge 10 ]; then
    echo -e "${GREEN}✓ 找到 $INDEX_COUNT 个索引${NC}"
    cat /tmp/linketry_indexes.txt
else
    echo -e "${YELLOW}⚠ 只找到 $INDEX_COUNT 个索引（预期 10+ 个）${NC}"
fi
echo ""

# 步骤 4: 部署 Worker
echo "⚙️  步骤 4: 部署 Worker"
echo "---------------------"
echo "正在部署 Worker..."
npm run deploy --workspace=apps/worker

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Worker 部署成功${NC}"
else
    echo -e "${RED}✗ Worker 部署失败${NC}"
    exit 1
fi
echo ""

# 步骤 5: 验证 Worker 部署
echo "✅ 步骤 5: 验证 Worker 部署"
echo "-------------------------"
echo "检查健康状态..."
HEALTH_RESPONSE=$(curl -s https://go.example.com/health || echo "")

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ Worker 健康检查通过${NC}"
    echo "$HEALTH_RESPONSE" | jq .
else
    echo -e "${RED}✗ Worker 健康检查失败${NC}"
    echo "$HEALTH_RESPONSE"
fi
echo ""

# 步骤 6: 部署 Admin
echo "🎨 步骤 6: 部署 Admin"
echo "--------------------"
read -p "请输入 LINKETRY_API_URL (例如: https://go.example.com): " API_URL

if [ -z "$API_URL" ]; then
    echo -e "${RED}✗ API_URL 不能为空${NC}"
    exit 1
fi

# 校验 URL 格式，必须以 https:// 开头
if [[ ! "$API_URL" =~ ^https://[a-zA-Z0-9._-]+(:[0-9]+)?(/.*)?$ ]]; then
    echo -e "${RED}✗ 无效的 API_URL（必须以 https:// 开头）${NC}"
    exit 1
fi

echo "正在构建 Admin..."
VITE_LINKETRY_API_URL="$API_URL" npm run build --workspace=apps/admin

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Admin 构建失败${NC}"
    exit 1
fi

echo "正在部署 Admin 到 Cloudflare Pages..."
read -p "请输入 Pages 项目名称 (例如: linketry-admin): " PAGES_PROJECT

if [ -z "$PAGES_PROJECT" ]; then
    echo -e "${RED}✗ Pages 项目名称不能为空${NC}"
    exit 1
fi

# 校验项目名称格式，防止命令注入
if [[ ! "$PAGES_PROJECT" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo -e "${RED}✗ 无效的 Pages 项目名称（只允许字母、数字、- 和 _）${NC}"
    exit 1
fi

wrangler pages deploy apps/admin/dist --project-name="$PAGES_PROJECT"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Admin 部署成功${NC}"
else
    echo -e "${RED}✗ Admin 部署失败${NC}"
    exit 1
fi
echo ""

# 步骤 7: 最终验证
echo "🎯 步骤 7: 最终验证"
echo "------------------"
echo "请手动验证以下项目："
echo ""
echo "1. 访问 Admin URL 并登录"
echo "2. 测试创建链接"
echo "3. 测试重定向功能"
echo "4. 检查性能监控日志"
echo ""
echo "验证命令："
echo "  wrangler tail --format pretty"
echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "📚 后续步骤："
echo "  1. 查看 POST_DEPLOYMENT_CHECKLIST.md 完成验证"
echo "  2. 监控性能指标 24 小时"
echo "  3. 如有问题参考 ROLLBACK_GUIDE.md"
echo ""
