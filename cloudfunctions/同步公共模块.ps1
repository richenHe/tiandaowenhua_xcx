#!/usr/bin/env pwsh
# 同步公共模块到各云函数
# 用途：将统一的 common 和 business-logic 复制到各模块
# 注意：自动排除 node_modules 目录

Write-Host "=== 🔄 同步公共模块 ===" -ForegroundColor Cyan

$modules = @("user", "order", "course", "ambassador", "system")
$commonSource = "common"
$businessSource = "business-logic"

# 排除的目录和文件
$excludes = @("node_modules", "package-lock.json")

foreach ($module in $modules) {
    Write-Host "`n📦 同步到 $module 模块..." -ForegroundColor Yellow
    
    # 检查模块是否存在
    if (!(Test-Path $module)) {
        Write-Host "  ⚠️  模块不存在，跳过" -ForegroundColor Gray
        continue
    }
    
    # 同步 common
    if (Test-Path $commonSource) {
        $target = "$module\common"
        if (!(Test-Path $target)) {
            New-Item -ItemType Directory -Path $target -Force | Out-Null
        }
        
        # 复制文件，排除 node_modules
        Get-ChildItem $commonSource -Recurse | Where-Object { 
            $relativePath = $_.FullName.Substring($commonSource.Length)
            $exclude = $false
            foreach ($pattern in $excludes) {
                if ($relativePath -like "*\$pattern\*" -or $_.Name -eq $pattern) {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        } | ForEach-Object {
            $targetPath = $_.FullName.Replace($commonSource, $target)
            $targetDir = Split-Path $targetPath -Parent
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            if ($_.PSIsContainer -eq $false) {
                Copy-Item $_.FullName $targetPath -Force
            }
        }
        Write-Host "  ✅ common 已同步（排除 node_modules）" -ForegroundColor Green
    }
    
    # 同步 business-logic
    if (Test-Path $businessSource) {
        $target = "$module\business-logic"
        if (!(Test-Path $target)) {
            New-Item -ItemType Directory -Path $target -Force | Out-Null
        }
        
        # 复制文件，排除 node_modules 和 package-lock.json
        Get-ChildItem $businessSource -Recurse | Where-Object { 
            $relativePath = $_.FullName.Substring($businessSource.Length)
            $exclude = $false
            foreach ($pattern in $excludes) {
                if ($relativePath -like "*\$pattern\*" -or $_.Name -eq $pattern) {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        } | ForEach-Object {
            $targetPath = $_.FullName.Replace($businessSource, $target)
            $targetDir = Split-Path $targetPath -Parent
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            if ($_.PSIsContainer -eq $false) {
                Copy-Item $_.FullName $targetPath -Force
            }
        }
        Write-Host "  ✅ business-logic 已同步（排除 node_modules）" -ForegroundColor Green
    }
}

Write-Host "`n✅ 所有模块同步完成！" -ForegroundColor Green
Write-Host "📝 下一步：部署更新的云函数" -ForegroundColor Cyan

