-- 朋友圈素材多图（最多 9 张）
-- 执行库：tiandao_culture
-- 上线顺序：先执行本 SQL → 再部署 course 云函数 → 再上传 admin 静态站

ALTER TABLE tiandao_culture.academy_materials
  ADD COLUMN images JSON NULL COMMENT '海报多图 cloud:// fileID 数组，最多9张；空则读 image_url' AFTER image_url;

-- 可选：把历史单图迁入 images，便于后台统一编辑（不执行亦可，接口已兼容仅 image_url）
-- UPDATE tiandao_culture.academy_materials
-- SET images = JSON_ARRAY(image_url)
-- WHERE images IS NULL AND image_url IS NOT NULL AND TRIM(image_url) <> '';
