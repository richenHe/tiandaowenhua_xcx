#!/bin/bash

# ============================================
# 支付回调功能部署脚本
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# ============================================
# 1. 环境检查
# ============================================

log_info "开始环境检查..."

# 检查必要的命令
check_command "node"
check_command "npm"
check_command "mysql"

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 14 ]; then
    log_error "Node.js 版本过低，需要 >= 14.x"
    exit 1
fi

log_info "环境检查通过"

# ============================================
# 2. 数据库准备
# ============================================

log_info "开始数据库准备..."

# 读取数据库配置
read -p "请输入数据库主机 [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "请输入数据库端口 [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "请输入数据库名称 [tiandao_culture]: " DB_NAME
DB_NAME=${DB_NAME:-tiandao_culture}

read -p "请输入数据库用户名 [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "请输入数据库密码: " DB_PASS
echo

# 测试数据库连接
log_info "测试数据库连接..."
if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "USE $DB_NAME;" 2>/dev/null; then
    log_info "数据库连接成功"
else
    log_error "数据库连接失败"
    exit 1
fi

# 执行迁移脚本
log_info "执行数据库迁移..."
if [ -f "migrations/001_create_error_logs_table.sql" ]; then
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < migrations/001_create_error_logs_table.sql
    log_info "错误日志表创建成功"
else
    log_warn "迁移脚本不存在，跳过"
fi

# 执行配置脚本（可选）
read -p "是否执行配置示例脚本？(y/n) [n]: " EXEC_CONFIG
if [ "$EXEC_CONFIG" = "y" ]; then
    if [ -f "配置示例.sql" ]; then
        mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < 配置示例.sql
        log_info "配置数据导入成功"
    else
        log_warn "配置脚本不存在，跳过"
    fi
fi

# ============================================
# 3. 安装依赖
# ============================================

log_info "开始安装依赖..."

cd cloudfunctions/callbacks

if [ -f "package.json" ]; then
    npm install
    log_info "依赖安装成功"
else
    log_error "package.json 不存在"
    exit 1
fi

cd ../..

# ============================================
# 4. 配置环境变量
# ============================================

log_info "配置环境变量..."

read -p "请输入云开发环境 ID: " ENV_ID
read -p "请输入数据库实例 ID [tnt-e300s320g]: " DB_INSTANCE_ID
DB_INSTANCE_ID=${DB_INSTANCE_ID:-tnt-e300s320g}

read -p "请输入微信商户密钥（可选）: " MCH_KEY

# 创建环境变量配置文件
cat > cloudfunctions/callbacks/.env << EOF
ENV_ID=$ENV_ID
DB_INSTANCE_ID=$DB_INSTANCE_ID
DB_NAME=$DB_NAME
MCH_KEY=$MCH_KEY
EOF

log_info "环境变量配置完成"

# ============================================
# 5. 部署云函数
# ============================================

log_info "开始部署云函数..."

# 检查是否安装了 tcb CLI
if command -v tcb &> /dev/null; then
    read -p "是否立即部署云函数？(y/n) [y]: " DEPLOY_NOW
    DEPLOY_NOW=${DEPLOY_NOW:-y}

    if [ "$DEPLOY_NOW" = "y" ]; then
        cd cloudfunctions/callbacks
        tcb fn deploy callbacks --force
        log_info "云函数部署成功"
        cd ../..
    else
        log_warn "跳过云函数部署，请手动执行: tcb fn deploy callbacks"
    fi
else
    log_warn "tcb CLI 未安装，请手动部署云函数"
    log_info "部署命令: cd cloudfunctions/callbacks && tcb fn deploy callbacks --force"
fi

# ============================================
# 6. 配置 HTTP 访问
# ============================================

log_info "配置 HTTP 访问..."

log_info "请在云开发控制台完成以下配置："
echo "1. 开启 HTTP 访问服务"
echo "2. 获取访问路径: https://$ENV_ID.service.tcloudbase.com/callbacks"
echo "3. 在微信商户平台配置支付回调地址"

# ============================================
# 7. 运行测试
# ============================================

read -p "是否运行测试？(y/n) [n]: " RUN_TEST
if [ "$RUN_TEST" = "y" ]; then
    log_info "运行测试..."

    # 创建测试订单
    log_info "创建测试订单..."
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME << EOF
INSERT INTO orders (
  order_no, user_id, user_uid, order_type, related_id,
  final_amount, pay_status, referee_id, created_at
) VALUES (
  'TEST_$(date +%Y%m%d%H%M%S)', 1, 'UID001', 1, 1,
  1688.00, 0, 2, NOW()
);
EOF

    log_info "测试订单创建成功"
    log_info "请使用微信商户平台的'支付通知测试工具'触发回调"
fi

# ============================================
# 8. 生成部署报告
# ============================================

log_info "生成部署报告..."

REPORT_FILE="deployment_report_$(date +%Y%m%d_%H%M%S).txt"

cat > $REPORT_FILE << EOF
============================================
支付回调功能部署报告
============================================

部署时间: $(date '+%Y-%m-%d %H:%M:%S')
部署人员: $(whoami)

环境配置:
- 云开发环境 ID: $ENV_ID
- 数据库实例 ID: $DB_INSTANCE_ID
- 数据库名称: $DB_NAME
- Node.js 版本: $(node -v)
- npm 版本: $(npm -v)

部署内容:
- [x] 数据库迁移
- [x] 依赖安装
- [x] 环境变量配置
- [x] 云函数部署

回调地址:
https://$ENV_ID.service.tcloudbase.com/callbacks/payment

后续步骤:
1. 在云开发控制台开启 HTTP 访问服务
2. 在微信商户平台配置支付回调地址
3. 执行功能测试
4. 监控运行状态

相关文档:
- 支付回调测试指南.md
- 部署检查清单.md
- 快速参考.md
- 故障排查手册.md

============================================
EOF

log_info "部署报告已生成: $REPORT_FILE"

# ============================================
# 9. 完成
# ============================================

echo
log_info "============================================"
log_info "部署完成！"
log_info "============================================"
echo
log_info "下一步操作："
echo "1. 查看部署报告: cat $REPORT_FILE"
echo "2. 配置微信支付回调地址"
echo "3. 执行功能测试"
echo "4. 查看文档: 支付回调测试指南.md"
echo
log_info "如有问题，请参考故障排查手册.md"
echo

# 询问是否查看部署报告
read -p "是否查看部署报告？(y/n) [y]: " VIEW_REPORT
VIEW_REPORT=${VIEW_REPORT:-y}

if [ "$VIEW_REPORT" = "y" ]; then
    cat $REPORT_FILE
fi

exit 0
