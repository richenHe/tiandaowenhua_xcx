#!/usr/bin/env python3
"""批量生成页面脚本"""

import os

# 页面配置
pages = [
    # 课程模块
    ("course/detail.html", "课程详情", "../../"),
    ("course/my-courses.html", "我的课程", "../../"),
    ("course/schedule.html", "课程计划", "../../"),
    ("course/appointment-confirm.html", "预约确认", "../../"),
    
    # 订单模块
    ("order/confirm.html", "订单确认", "../../"),
    ("order/select-referee.html", "选择推荐人", "../../"),
    ("order/payment.html", "支付", "../../"),
    ("order/detail.html", "订单详情", "../../"),
    
    # 个人中心模块
    ("mine/index.html", "我的", "../../"),
    ("mine/profile.html", "个人资料", "../../"),
    ("mine/referee-manage.html", "推荐人管理", "../../"),
    ("mine/orders.html", "订单记录", "../../"),
    ("mine/appointments.html", "预约记录", "../../"),
    ("mine/feedback.html", "意见反馈", "../../"),
    ("mine/consultation.html", "咨询预约", "../../"),
    ("mine/contracts.html", "我的协议", "../../"),
    
    # 大使模块
    ("ambassador/level.html", "传播大使等级", "../../"),
    ("ambassador/apply.html", "申请传播大使", "../../"),
    ("ambassador/upgrade-guide.html", "升级引导", "../../"),
    ("ambassador/contract-sign.html", "签署协议", "../../"),
    ("ambassador/contract-detail.html", "协议详情", "../../"),
    ("ambassador/merit-points.html", "功德分管理", "../../"),
    ("ambassador/cash-points.html", "积分管理", "../../"),
    ("ambassador/withdraw.html", "申请提现", "../../"),
    ("ambassador/qrcode.html", "推荐二维码", "../../"),
    ("ambassador/team.html", "推荐团队", "../../"),
    ("ambassador/activity-records.html", "活动记录", "../../"),
    
    # 商学院模块
    ("academy/intro.html", "商学院介绍", "../../"),
    ("academy/materials.html", "朋友圈素材", "../../"),
    ("academy/cases.html", "学员案例", "../../"),
    
    # 公共模块
    ("common/announcement.html", "通知公告", "../../"),
]

template = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - 天道文化</title>
  <link rel="stylesheet" href="{path}styles/tdesign-theme.css">
  <link rel="stylesheet" href="{path}styles/reset.css">
  <link rel="stylesheet" href="{path}styles/common.css">
  <link rel="stylesheet" href="{path}components/all.css">
  <style>
    body {{
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }}
  </style>
</head>
<body>
  <div class="device-iphone15pro device-iphone15pro--animated">
    <div class="device-frame">
      <div class="device-notch"></div>
      <div class="device-statusbar">
        <span class="statusbar-time">9:41</span>
        <div style="display: flex; gap: 4px;">
          <span class="statusbar-signal"></span>
          <span class="statusbar-wifi"></span>
          <span class="statusbar-battery"></span>
        </div>
      </div>
      
      <div class="device-screen">
        <div class="page-header">
          <div class="page-header__back">←</div>
          <div class="page-header__title">{title}</div>
          <div class="page-header__action"></div>
        </div>

        <div class="scroll-area scroll-area--with-header">
          <div class="page-content">
            <div class="t-card t-card--bordered">
              <div class="t-card__header">
                <div class="t-card__header-wrapper">
                  <div class="t-card__title">{title}</div>
                </div>
              </div>
              <div class="t-card__body">
                <p style="color: var(--td-text-color-secondary);">
                  这是 {title} 页面的内容。基于 TDesign 设计规范开发。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="device-safe-area-bottom"></div>
    </div>
  </div>
</body>
</html>
'''

def main():
    base_dir = "pages"
    
    for filepath, title, path in pages:
        full_path = os.path.join(base_dir, filepath)
        content = template.format(title=title, path=path)
        
        # 创建目录
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # 写入文件
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Created: {full_path}")
    
    print(f"\n完成！共创建 {len(pages)} 个页面")

if __name__ == "__main__":
    main()














































