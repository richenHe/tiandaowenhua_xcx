/**
 * 客户端接口：获取活动记录列表
 * Action: client:getActivityRecords
 * @description 获取用户的活动记录列表，支持分页和类型筛选
 */
const { db, response, executePaginatedQuery, getTempFileURL } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { activityType = 0, page = 1, page_size = 10, pageSize } = event;

  try {
    console.log('[getActivityRecords] 获取活动记录:', {
      userId: user.id,
      activityType,
      page,
      page_size
    });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询
    let queryBuilder = db
      .from('ambassador_activity_records')
      .select(`
        id,
        activity_type,
        activity_name,
        activity_desc,
        location,
        start_time,
        duration,
        participant_count,
        merit_points,
        note,
        images,
        created_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 1)
      .order('start_time', { ascending: false });

    // 如果指定了活动类型，添加类型筛选
    if (activityType > 0) {
      queryBuilder = queryBuilder.eq('activity_type', activityType);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 转换云存储 fileID 为临时 URL
    const list = result.list || [];
    if (list.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      list.forEach(record => {
        // images 是 JSON 数组，包含多个 fileID
        if (record.images) {
          try {
            const imagesArray = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
            if (Array.isArray(imagesArray)) {
              imagesArray.forEach(imgFileID => {
                if (imgFileID) fileIDs.push(imgFileID);
              });
            }
          } catch (e) {
            console.error('[getActivityRecords] JSON解析失败:', e);
          }
        }
      });

      // 批量获取临时 URL
      let urlMap = {};
      if (fileIDs.length > 0) {
        const tempURLs = await getTempFileURL(fileIDs);
        tempURLs.forEach((urlObj, index) => {
          if (urlObj && urlObj.tempFileURL) {
            urlMap[fileIDs[index]] = urlObj.tempFileURL;
          }
        });
      }

      // 替换 list 中的 fileID 为临时 URL
      list.forEach(record => {
        if (record.images) {
          try {
            const imagesArray = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
            if (Array.isArray(imagesArray)) {
              record.images = imagesArray.map(imgFileID =>
                urlMap[imgFileID] || imgFileID
              );
            }
          } catch (e) {
            console.error('[getActivityRecords] JSON转换失败:', e);
            record.images = [];
          }
        }
      });
    }

    // 查询统计信息（所有有效记录）
    const { data: allRecords, error: statsError } = await db
      .from('ambassador_activity_records')
      .select('activity_type, merit_points, start_time')
      .eq('user_id', user.id)
      .eq('status', 1);

    if (statsError) {
      throw statsError;
    }

    // 计算统计数据
    const stats = {
      total_count: allRecords?.length || 0,
      total_merit_points: 0,
      month_count: 0,
      type_stats: {
        1: 0,  // 辅导员
        2: 0,  // 会务义工
        3: 0,  // 沙龙组织
        4: 0   // 其他活动
      }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    (allRecords || []).forEach(record => {
      // 累计功德分
      stats.total_merit_points += parseFloat(record.merit_points) || 0;

      // 统计活动类型
      if (record.activity_type >= 1 && record.activity_type <= 4) {
        stats.type_stats[record.activity_type]++;
      }

      // 统计本月活动
      const recordDate = new Date(record.start_time);
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        stats.month_count++;
      }
    });

    const finalResult = {
      ...result,
      list,
      stats
    };

    console.log('[getActivityRecords] 查询成功:', {
      listCount: list.length,
      total: result.total,
      stats
    });

    return response.success(finalResult);

  } catch (error) {
    console.error('[getActivityRecords] 查询失败:', error);
    return response.error('获取活动记录失败', error);
  }
};
