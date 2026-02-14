# getCalendarSchedule 接口文档

## 接口说明
用于首页日历展示有课程的日期及课程信息。

## 接口信息
- **云函数**: course
- **Action**: getCalendarSchedule
- **类型**: 公共接口（无需鉴权）
- **路径**: `cloudfunctions/course/handlers/public/getCalendarSchedule.js`

## 业务规则
1. **一天只显示一个课程**：如果当天有多个课程，显示 courses 表 id 正序的第一个课程
2. **显示课程昵称**：优先显示 courses.nickname 字段（如"初探"），用于简洁展示
3. **显示上课时间**：显示当天课程的上课时间（如"09:00-17:00"）
4. **只显示正常状态**：仅查询 class_records.status = 1 的排期

## 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|-------|------|------|------|------|
| startDate | string | 是 | 开始日期 (YYYY-MM-DD) | "2026-02-01" |
| endDate | string | 是 | 结束日期 (YYYY-MM-DD) | "2026-02-28" |

### 请求示例
```javascript
{
  "action": "getCalendarSchedule",
  "startDate": "2026-02-01",
  "endDate": "2026-02-28"
}
```

## 返回数据

### 成功响应
```javascript
{
  "success": true,
  "code": 0,
  "message": "获取成功",
  "data": {
    "2026-02-15": {
      "courseId": 1,
      "nickname": "初探",              // 课程昵称（优先显示）
      "courseName": "初探班",          // 课程完整名称
      "classTime": "09:00-17:00",     // 上课时间
      "classRecordId": 10
    },
    "2026-02-20": {
      "courseId": 2,
      "nickname": "密训",
      "courseName": "密训班",
      "classTime": "09:00-18:00",
      "classRecordId": 15
    }
  }
}
```

### 返回字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| [日期字符串] | object | 以日期（YYYY-MM-DD）为键，课程信息为值 |
| courseId | number | 课程ID（来自 courses.id） |
| nickname | string | 课程昵称（来自 courses.nickname，优先显示） |
| courseName | string | 课程完整名称（来自 class_records.course_name） |
| classTime | string | 上课时间（如"09:00-17:00"） |
| classRecordId | number | 上课计划ID（来自 class_records.id） |

### 错误响应
```javascript
{
  "success": false,
  "code": 400,
  "message": "缺少必要参数：startDate 和 endDate"
}
```

## 数据库查询逻辑

### 查询语句
```javascript
const { data: records, error } = await db
  .from('class_records')
  .select(`
    id,
    course_id,
    course_name,
    class_date,
    class_time,
    course:courses!fk_class_records_course(nickname)
  `)
  .gte('class_date', startDate)
  .lte('class_date', endDate)
  .eq('status', 1)
  .order('class_date', { ascending: true })
  .order('course_id', { ascending: true });
```

### 关键点说明
1. **JOIN courses 表**：通过外键 `fk_class_records_course` 关联 courses 表，获取 nickname 字段
2. **按日期和课程ID排序**：确保同一天多个课程时，取 course_id 最小的
3. **去重逻辑**：在代码中遍历时，每个日期只保留第一条记录

### 去重处理
```javascript
records.forEach(record => {
  const dateStr = record.class_date;
  
  // 如果当天还没有课程，或者当前课程的course_id更小
  if (!calendarData[dateStr] || record.course_id < calendarData[dateStr].courseId) {
    calendarData[dateStr] = {
      courseId: record.course_id,
      nickname: record.course?.nickname || '',
      courseName: record.course_name,
      classTime: record.class_time,
      classRecordId: record.id
    };
  }
});
```

## 前端调用示例

### API 定义
```typescript
// src/api/modules/course.ts
export interface CalendarScheduleItem {
  courseId: number;
  nickname: string;        // 课程昵称
  courseName: string;      // 课程完整名称
  classTime: string;       // 上课时间
  classRecordId: number;
}

export interface CalendarScheduleResponse {
  [date: string]: CalendarScheduleItem;  // 日期为键
}

export const CourseApi = {
  getCalendarSchedule: (params: { 
    startDate: string; 
    endDate: string;
  }) => request<CalendarScheduleResponse>({
    action: 'getCalendarSchedule',
    ...params
  })
}
```

### 页面中使用
```typescript
// 获取当月日历数据
const getMonthCalendar = async () => {
  const startDate = '2026-02-01';
  const endDate = '2026-02-28';
  
  const calendar = await CourseApi.getCalendarSchedule({
    startDate,
    endDate
  });
  
  // calendar 数据结构：
  // {
  //   "2026-02-15": { courseId: 1, nickname: "初探", ... },
  //   "2026-02-20": { courseId: 2, nickname: "密训", ... }
  // }
  
  // 渲染日历时，优先显示 nickname
  Object.keys(calendar).forEach(date => {
    const item = calendar[date];
    // 显示：item.nickname || item.courseName
    // 例如：显示"初探"而不是"初探班"
  });
};
```

### 日历组件示例
```vue
<template>
  <view class="calendar">
    <view 
      v-for="date in calendarDates" 
      :key="date" 
      class="calendar-cell"
    >
      <view class="date">{{ formatDate(date) }}</view>
      <view v-if="calendarData[date]" class="course-tag">
        <!-- 优先显示 nickname，如果没有则显示 courseName -->
        {{ calendarData[date].nickname || calendarData[date].courseName }}
      </view>
      <view v-if="calendarData[date]" class="time-tag">
        {{ calendarData[date].classTime }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CourseApi } from '@/api/modules/course'

const calendarData = ref({})

onMounted(async () => {
  // 获取当月1号到最后一天
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  
  calendarData.value = await CourseApi.getCalendarSchedule({
    startDate,
    endDate
  })
})
</script>
```

## 注意事项

1. **课程排序规则**：
   - 同一天有多个课程时，显示 courses 表 id 最小的课程
   - 例如：2月15日有课程1和课程3，则显示课程1

2. **nickname 字段**：
   - 优先显示 courses.nickname（如"初探"）
   - 如果 nickname 为空，则显示 course_name（如"初探班"）
   - 建议在界面上使用 `nickname || courseName` 的逻辑

3. **日期格式**：
   - 请求参数和返回数据的日期格式统一为 YYYY-MM-DD
   - 例如："2026-02-15"

4. **性能优化**：
   - 使用 Query Builder JOIN 避免 N+1 查询
   - 通过外键关联一次性获取所有需要的数据

5. **数据来源**：
   - `courseId`, `courseName`, `classTime`, `classRecordId` 来自 class_records 表
   - `nickname` 来自 courses 表（通过 JOIN 关联）

---

**文档版本**: v1.1  
**最后更新**: 2026-02-11  
**更新内容**: 新增 nickname 字段，使用 JOIN 查询优化











