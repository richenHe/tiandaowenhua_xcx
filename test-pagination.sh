#!/bin/bash

# 分页接口测试脚本
# 用于验证所有分页接口是否正确返回统一格式

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 云函数基础 URL（根据实际环境修改）
BASE_URL="http://localhost:8080"

# 测试函数
test_pagination_api() {
  local function_name=$1
  local action=$2
  local test_name=$3
  local extra_params=$4

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  echo -e "\n${YELLOW}[测试 $TOTAL_TESTS] $test_name${NC}"
  echo "云函数: $function_name, Action: $action"

  # 构建请求数据
  local request_data="{\"action\":\"$action\",\"page\":1,\"page_size\":10$extra_params}"

  # 发送请求
  local response=$(curl -s -X POST "$BASE_URL/$function_name" \
    -H "Content-Type: application/json" \
    -d "$request_data")

  # 检查响应是否为空
  if [ -z "$response" ]; then
    echo -e "${RED}✗ 失败: 响应为空${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi

  # 解析响应
  local code=$(echo "$response" | jq -r '.code')
  local has_list=$(echo "$response" | jq 'has("data.list")')
  local has_total=$(echo "$response" | jq 'has("data.total")')
  local has_page=$(echo "$response" | jq 'has("data.page")')
  local has_pageSize=$(echo "$response" | jq 'has("data.pageSize")')
  local has_totalPages=$(echo "$response" | jq 'has("data.totalPages")')
  local has_hasMore=$(echo "$response" | jq 'has("data.hasMore")')
  local has_hasPrev=$(echo "$response" | jq 'has("data.hasPrev")')

  # 验证响应格式
  local all_passed=true

  if [ "$code" != "0" ]; then
    echo -e "${RED}✗ code 不为 0: $code${NC}"
    all_passed=false
  fi

  if [ "$has_list" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.list 字段${NC}"
    all_passed=false
  fi

  if [ "$has_total" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.total 字段${NC}"
    all_passed=false
  fi

  if [ "$has_page" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.page 字段${NC}"
    all_passed=false
  fi

  if [ "$has_pageSize" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.pageSize 字段${NC}"
    all_passed=false
  fi

  if [ "$has_totalPages" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.totalPages 字段${NC}"
    all_passed=false
  fi

  if [ "$has_hasMore" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.hasMore 字段${NC}"
    all_passed=false
  fi

  if [ "$has_hasPrev" != "true" ]; then
    echo -e "${RED}✗ 缺少 data.hasPrev 字段${NC}"
    all_passed=false
  fi

  # 输出结果
  if [ "$all_passed" = true ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))

    # 显示分页信息
    local total=$(echo "$response" | jq -r '.data.total')
    local totalPages=$(echo "$response" | jq -r '.data.totalPages')
    local hasMore=$(echo "$response" | jq -r '.data.hasMore')
    echo "  总数: $total, 总页数: $totalPages, 有更多: $hasMore"
  else
    echo -e "${RED}✗ 失败${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# 开始测试
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}分页接口测试开始${NC}"
echo -e "${GREEN}========================================${NC}"

# 课程模块测试
echo -e "\n${YELLOW}=== 课程模块 ===${NC}"
test_pagination_api "course" "getList" "获取课程列表"
test_pagination_api "course" "getCaseList" "获取案例列表"
test_pagination_api "course" "getMaterialList" "获取资料列表"
test_pagination_api "course" "getClassRecords" "获取上课排期"
test_pagination_api "course" "getMyAppointments" "获取我的预约"

# 订单模块测试
echo -e "\n${YELLOW}=== 订单模块 ===${NC}"
test_pagination_api "order" "getMallCourses" "获取商城课程"
test_pagination_api "order" "getMallGoods" "获取商城商品"
test_pagination_api "order" "getList" "获取订单列表"
test_pagination_api "order" "getExchangeRecords" "获取兑换记录"

# 用户模块测试
echo -e "\n${YELLOW}=== 用户模块 ===${NC}"
test_pagination_api "user" "getMyCourses" "获取我的课程"
test_pagination_api "user" "getMyReferees" "获取推荐用户"
test_pagination_api "user" "getCashPointsHistory" "获取积分明细"
test_pagination_api "user" "getMeritPointsHistory" "获取功德分明细"
test_pagination_api "user" "getWithdrawRecords" "获取提现记录"
test_pagination_api "user" "getMyOrders" "获取我的订单"

# 大使模块测试
echo -e "\n${YELLOW}=== 大使模块 ===${NC}"
test_pagination_api "ambassador" "getActivityRecords" "获取活动记录"

# 系统模块测试
echo -e "\n${YELLOW}=== 系统模块 ===${NC}"
test_pagination_api "system" "getAnnouncementList" "获取公告列表"
test_pagination_api "system" "getMyFeedback" "获取我的反馈"

# 输出测试结果
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "\n${RED}✗ 有 $FAILED_TESTS 个测试失败${NC}"
  exit 1
fi
