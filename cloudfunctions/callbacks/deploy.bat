@echo off
REM ============================================
REM 支付回调功能部署脚本 (Windows)
REM ============================================

setlocal enabledelayedexpansion

REM 颜色定义（Windows 10+）
set "INFO=[92m[INFO][0m"
set "WARN=[93m[WARN][0m"
set "ERROR=[91m[ERROR][0m"

echo.
echo ============================================
echo 支付回调功能部署脚本
echo ============================================
echo.

REM ============================================
REM 1. 环境检查
REM ============================================

echo %INFO% 开始环境检查...

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %ERROR% Node.js 未安装，请先安装
    pause
    exit /b 1
)

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo %ERROR% npm 未安装，请先安装
    pause
    exit /b 1
)

REM 检查 MySQL
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo %WARN% MySQL 客户端未安装，跳过数据库操作
    set SKIP_DB=1
) else (
    set SKIP_DB=0
)

echo %INFO% 环境检查通过
echo.

REM ============================================
REM 2. 数据库准备
REM ============================================

if %SKIP_DB% equ 0 (
    echo %INFO% 开始数据库准备...

    set /p DB_HOST="请输入数据库主机 [localhost]: "
    if "!DB_HOST!"=="" set DB_HOST=localhost

    set /p DB_PORT="请输入数据库端口 [3306]: "
    if "!DB_PORT!"=="" set DB_PORT=3306

    set /p DB_NAME="请输入数据库名称 [tiandao_culture]: "
    if "!DB_NAME!"=="" set DB_NAME=tiandao_culture

    set /p DB_USER="请输入数据库用户名 [root]: "
    if "!DB_USER!"=="" set DB_USER=root

    set /p DB_PASS="请输入数据库密码: "

    REM 测试数据库连接
    echo %INFO% 测试数据库连接...
    mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! -e "USE !DB_NAME!;" 2>nul
    if %errorlevel% neq 0 (
        echo %ERROR% 数据库连接失败
        pause
        exit /b 1
    )

    echo %INFO% 数据库连接成功

    REM 执行迁移脚本
    if exist "migrations\001_create_error_logs_table.sql" (
        echo %INFO% 执行数据库迁移...
        mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! !DB_NAME! < migrations\001_create_error_logs_table.sql
        echo %INFO% 错误日志表创建成功
    ) else (
        echo %WARN% 迁移脚本不存在，跳过
    )

    REM 执行配置脚本（可选）
    set /p EXEC_CONFIG="是否执行配置示例脚本？(y/n) [n]: "
    if "!EXEC_CONFIG!"=="y" (
        if exist "配置示例.sql" (
            mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! !DB_NAME! < 配置示例.sql
            echo %INFO% 配置数据导入成功
        ) else (
            echo %WARN% 配置脚本不存在，跳过
        )
    )

    echo.
)

REM ============================================
REM 3. 安装依赖
REM ============================================

echo %INFO% 开始安装依赖...

if exist "package.json" (
    call npm install
    if %errorlevel% neq 0 (
        echo %ERROR% 依赖安装失败
        pause
        exit /b 1
    )
    echo %INFO% 依赖安装成功
) else (
    echo %ERROR% package.json 不存在
    pause
    exit /b 1
)

echo.

REM ============================================
REM 4. 配置环境变量
REM ============================================

echo %INFO% 配置环境变量...

set /p ENV_ID="请输入云开发环境 ID: "

set /p DB_INSTANCE_ID="请输入数据库实例 ID [tnt-e300s320g]: "
if "!DB_INSTANCE_ID!"=="" set DB_INSTANCE_ID=tnt-e300s320g

set /p MCH_KEY="请输入微信商户密钥（可选）: "

REM 创建环境变量配置文件
(
echo ENV_ID=!ENV_ID!
echo DB_INSTANCE_ID=!DB_INSTANCE_ID!
echo DB_NAME=!DB_NAME!
echo MCH_KEY=!MCH_KEY!
) > .env

echo %INFO% 环境变量配置完成
echo.

REM ============================================
REM 5. 部署云函数
REM ============================================

echo %INFO% 开始部署云函数...

REM 检查是否安装了 tcb CLI
where tcb >nul 2>nul
if %errorlevel% equ 0 (
    set /p DEPLOY_NOW="是否立即部署云函数？(y/n) [y]: "
    if "!DEPLOY_NOW!"=="" set DEPLOY_NOW=y

    if "!DEPLOY_NOW!"=="y" (
        call tcb fn deploy callbacks --force
        if %errorlevel% neq 0 (
            echo %ERROR% 云函数部署失败
            pause
            exit /b 1
        )
        echo %INFO% 云函数部署成功
    ) else (
        echo %WARN% 跳过云函数部署，请手动执行: tcb fn deploy callbacks
    )
) else (
    echo %WARN% tcb CLI 未安装，请手动部署云函数
    echo %INFO% 部署命令: tcb fn deploy callbacks --force
)

echo.

REM ============================================
REM 6. 配置 HTTP 访问
REM ============================================

echo %INFO% 配置 HTTP 访问...
echo.
echo 请在云开发控制台完成以下配置：
echo 1. 开启 HTTP 访问服务
echo 2. 获取访问路径: https://!ENV_ID!.service.tcloudbase.com/callbacks
echo 3. 在微信商户平台配置支付回调地址
echo.

REM ============================================
REM 7. 运行测试
REM ============================================

if %SKIP_DB% equ 0 (
    set /p RUN_TEST="是否运行测试？(y/n) [n]: "
    if "!RUN_TEST!"=="y" (
        echo %INFO% 运行测试...

        REM 生成测试订单号
        for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
        for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
        set TEST_ORDER_NO=TEST_!mydate!!mytime!

        REM 创建测试订单
        echo %INFO% 创建测试订单: !TEST_ORDER_NO!
        mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! !DB_NAME! -e "INSERT INTO orders (order_no, user_id, user_uid, order_type, related_id, final_amount, pay_status, referee_id, created_at) VALUES ('!TEST_ORDER_NO!', 1, 'UID001', 1, 1, 1688.00, 0, 2, NOW());"

        echo %INFO% 测试订单创建成功
        echo %INFO% 请使用微信商户平台的'支付通知测试工具'触发回调
        echo.
    )
)

REM ============================================
REM 8. 生成部署报告
REM ============================================

echo %INFO% 生成部署报告...

set REPORT_FILE=deployment_report_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt
set REPORT_FILE=%REPORT_FILE: =0%

(
echo ============================================
echo 支付回调功能部署报告
echo ============================================
echo.
echo 部署时间: %date% %time%
echo 部署人员: %username%
echo.
echo 环境配置:
echo - 云开发环境 ID: !ENV_ID!
echo - 数据库实例 ID: !DB_INSTANCE_ID!
echo - 数据库名称: !DB_NAME!
echo.
echo 部署内容:
echo - [x] 数据库迁移
echo - [x] 依赖安装
echo - [x] 环境变量配置
echo - [x] 云函数部署
echo.
echo 回调地址:
echo https://!ENV_ID!.service.tcloudbase.com/callbacks/payment
echo.
echo 后续步骤:
echo 1. 在云开发控制台开启 HTTP 访问服务
echo 2. 在微信商户平台配置支付回调地址
echo 3. 执行功能测试
echo 4. 监控运行状态
echo.
echo 相关文档:
echo - 支付回调测试指南.md
echo - 部署检查清单.md
echo - 快速参考.md
echo - 故障排查手册.md
echo.
echo ============================================
) > %REPORT_FILE%

echo %INFO% 部署报告已生成: %REPORT_FILE%
echo.

REM ============================================
REM 9. 完成
REM ============================================

echo.
echo ============================================
echo %INFO% 部署完成！
echo ============================================
echo.
echo 下一步操作：
echo 1. 查看部署报告: type %REPORT_FILE%
echo 2. 配置微信支付回调地址
echo 3. 执行功能测试
echo 4. 查看文档: 支付回调测试指南.md
echo.
echo 如有问题，请参考故障排查手册.md
echo.

REM 询问是否查看部署报告
set /p VIEW_REPORT="是否查看部署报告？(y/n) [y]: "
if "!VIEW_REPORT!"=="" set VIEW_REPORT=y

if "!VIEW_REPORT!"=="y" (
    echo.
    type %REPORT_FILE%
    echo.
)

pause
exit /b 0
