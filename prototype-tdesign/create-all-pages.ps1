# 批量创建所有剩余页面的PowerShell脚本

$template = @'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - 天道文化</title>
  <link rel="stylesheet" href="{{PATH}}styles/tdesign-theme.css">
  <link rel="stylesheet" href="{{PATH}}styles/reset.css">
  <link rel="stylesheet" href="{{PATH}}styles/common.css">
  <link rel="stylesheet" href="{{PATH}}components/all.css">
  <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}</style>
</head>
<body>
  <div class="device-iphone15pro device-iphone15pro--animated">
    <div class="device-frame">
      <div class="device-notch"></div>
      <div class="device-statusbar"><span class="statusbar-time">9:41</span><div style="display:flex;gap:4px"><span class="statusbar-signal"></span><span class="statusbar-wifi"></span><span class="statusbar-battery"></span></div></div>
      <div class="device-screen">
        <div class="page-header"><div class="page-header__back">←</div><div class="page-header__title">{{TITLE}}</div><div class="page-header__action"></div></div>
        <div class="scroll-area scroll-area--with-header"><div class="page-content">
          <div class="t-card t-card--bordered"><div class="t-card__header"><div class="t-card__header-wrapper"><div class="t-card__title">{{TITLE}}</div></div></div><div class="t-card__body"><p style="color:var(--td-text-color-secondary)">这是 {{TITLE}} 页面的内容。基于 TDesign 设计规范开发。</p></div></div>
        </div></div>
      </div>
      <div class="device-safe-area-bottom"></div>
    </div>
  </div>
</body>
</html>
'@

$pages = @(
    @{File="pages\order\select-referee.html"; Title="选择推荐人"; Path="../../"},
    @{File="pages\order\payment.html"; Title="支付"; Path="../../"},
    @{File="pages\order\detail.html"; Title="订单详情"; Path="../../"},
    @{File="pages\mine\index.html"; Title="我的"; Path="../../"},
    @{File="pages\mine\profile.html"; Title="个人资料"; Path="../../"},
    @{File="pages\mine\referee-manage.html"; Title="推荐人管理"; Path="../../"},
    @{File="pages\mine\orders.html"; Title="订单记录"; Path="../../"},
    @{File="pages\mine\appointments.html"; Title="预约记录"; Path="../../"},
    @{File="pages\mine\feedback.html"; Title="意见反馈"; Path="../../"},
    @{File="pages\mine\consultation.html"; Title="咨询预约"; Path="../../"},
    @{File="pages\mine\contracts.html"; Title="我的协议"; Path="../../"},
    @{File="pages\ambassador\level.html"; Title="传播大使等级"; Path="../../"},
    @{File="pages\ambassador\apply.html"; Title="申请传播大使"; Path="../../"},
    @{File="pages\ambassador\upgrade-guide.html"; Title="升级引导"; Path="../../"},
    @{File="pages\ambassador\contract-sign.html"; Title="签署协议"; Path="../../"},
    @{File="pages\ambassador\contract-detail.html"; Title="协议详情"; Path="../../"},
    @{File="pages\ambassador\merit-points.html"; Title="功德分管理"; Path="../../"},
    @{File="pages\ambassador\cash-points.html"; Title="积分管理"; Path="../../"},
    @{File="pages\ambassador\withdraw.html"; Title="申请提现"; Path="../../"},
    @{File="pages\ambassador\qrcode.html"; Title="推荐二维码"; Path="../../"},
    @{File="pages\ambassador\team.html"; Title="推荐团队"; Path="../../"},
    @{File="pages\ambassador\activity-records.html"; Title="活动记录"; Path="../../"},
    @{File="pages\academy\intro.html"; Title="商学院介绍"; Path="../../"},
    @{File="pages\academy\materials.html"; Title="朋友圈素材"; Path="../../"},
    @{File="pages\academy\cases.html"; Title="学员案例"; Path="../../"},
    @{File="pages\common\announcement.html"; Title="通知公告"; Path="../../"}
)

$count = 0
foreach ($page in $pages) {
    $content = $template -replace '{{TITLE}}', $page.Title -replace '{{PATH}}', $page.Path
    $content | Out-File -FilePath $page.File -Encoding utf8
    $count++
    Write-Host "✓ Created: $($page.File)"
}

Write-Host "`n完成！共创建 $count 个页面"

































