# Feishu Calendar Skill
飞书日历操作技能，用于读取、创建、管理飞书日历事件，支持个人和企业日历操作。

- name: feishu-calendar
- description: 飞书日历管理技能，支持日程查询、创建、更新、删除和重复规则设置，用于个人和企业日历操作。
- license: MIT
- metadata:
  - author: nuonuo
  - version: "1.0.0"
- compatibility: Node.js >= 18
- allowed-tools: web_fetch
----
## 功能特性

✅ 获取日历列表  
✅ 查询日程事件（支持时间范围、分页）  
✅ 创建日程（支持全天事件、定时事件）  
✅ 更新日程（修改内容、设置重复规则）  
✅ 删除日程  
✅ 设置提醒（支持多层级提醒）  
✅ 支持每年/每月/每周重复  
✅ 正确处理时区和全天事件  

## 安装

1. 复制 `feishu-calendar` 目录到你的 OpenClaw skills 目录
2. 配置飞书应用凭证（见下方配置说明）
3. 在飞书开放平台开通日历权限

## 配置

### 1. 创建飞书应用

访问 [飞书开放平台](https://open.feishu.cn/app) 创建企业自建应用：

1. 点击「创建企业自建应用」
2. 填写应用名称（如「日历助手」）
3. 进入「权限管理」开通以下权限：
   - `calendar:calendar:read` - 读取日历
   - `calendar:calendar.event:read` - 读取日程
   - `calendar:calendar.event:create` - 创建日程
   - `calendar:calendar.event:update` - 更新日程
   - `calendar:calendar.event:delete` - 删除日程

### 2. 获取凭证

在「凭证与基础信息」中获取：
- **App ID**: `cli_xxxxxxxxxxxx`
- **App Secret**: `xxxxxxxxxxxxx`

### 3. 配置方式

#### 方式一：OpenClaw 平台配置（推荐）

在 OpenClaw 平台的配置中设置以下参数：

```
channels.feishu.appId: "cli_xxxxxxxxxxxx"
channels.feishu.appSecret: "xxxxxxxxxxxxx"
```

#### 方式二：环境变量

在 OpenClaw 环境或脚本中设置环境变量：

```bash
export FEISHU_APP_ID=cli_xxxxxxxxxxxx
export FEISHU_APP_SECRET=xxxxxxxxxxxxx
```

## 使用方法

### 使用提供的客户端库

项目提供了一个完整的客户端库，封装了所有API调用细节，包括token管理、分页处理、错误处理等。

```javascript
const {
  getAccessToken,
  getCalendars,
  getAllCalendars,
  getEvents,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  formatTime,
  getTodayEvents
} = require('./scripts/calendar-client');

// 1. 获取访问令牌
const token = await getAccessToken();

// 2. 获取日历列表
const calendars = await getAllCalendars(token);

// 3. 获取主日历
const primaryCalendar = calendars.find(c => c.is_primary) || calendars[0];

// 4. 获取特定时间范围的事件
const startTime = '2026-03-01T00:00:00+08:00';
const endTime = '2026-03-01T23:59:59+08:00';
const events = await getAllEvents(token, primaryCalendar.calendar_id, startTime, endTime);

// 5. 创建事件
const eventData = {
  summary: '🎂 生日',
  description: '祝生日快乐！',
  start_time: { date: '2026-05-01', timezone: 'Asia/Shanghai' },
  end_time: { date: '2026-05-01', timezone: 'Asia/Shanghai' },
  is_all_day: true,
  reminders: [
    { minutes: 7200 },  // 提前5天
    { minutes: 1440 }   // 提前1天
  ],
  recurrence: 'FREQ=YEARLY;INTERVAL=1'  // 每年重复
};
const newEvent = await createEvent(token, primaryCalendar.calendar_id, eventData);

// 6. 更新事件
const updateData = {
  recurrence: 'FREQ=YEARLY;INTERVAL=1'
};
await updateEvent(token, primaryCalendar.calendar_id, newEvent.event_id, updateData);

// 7. 删除事件
await deleteEvent(token, primaryCalendar.calendar_id, newEvent.event_id);

// 8. 获取今天的日程（简化方法）
const todayEvents = await getTodayEvents();
console.log('今日日程:', todayEvents.events);
```

## API 参考

| 功能 | 方法 | API 路径 |
|------|------|----------|
| 获取 Token | POST | /auth/v3/tenant_access_token/internal |
| 获取日历列表 | GET | /calendar/v4/calendars |
| 获取日程 | GET | /calendar/v4/calendars/{calendar_id}/events |
| 创建日程 | POST | /calendar/v4/calendars/{calendar_id}/events |
| 更新日程 | PATCH | /calendar/v4/calendars/{calendar_id}/events/{event_id} |
| 删除日程 | DELETE | /calendar/v4/calendars/{calendar_id}/events/{event_id} |

## 字段说明

### 时间格式

**全天事件**：
```json
{
  "start_time": { "date": "2026-05-01", "timezone": "Asia/Shanghai" },
  "end_time": { "date": "2026-05-01", "timezone": "Asia/Shanghai" },
  "is_all_day": true
}
```

**定时事件**：
```json
{
  "start_time": { "timestamp": "1772366400", "timezone": "Asia/Shanghai" },
  "end_time": { "timestamp": "1772373600", "timezone": "Asia/Shanghai" }
}
```

### 重复规则

| 规则 | 说明 |
|------|------|
| `FREQ=DAILY;INTERVAL=1` | 每天重复 |
| `FREQ=WEEKLY;INTERVAL=1` | 每周重复 |
| `FREQ=MONTHLY;INTERVAL=1` | 每月重复 |
| `FREQ=YEARLY;INTERVAL=1` | 每年重复 |

### 提醒设置

```json
{
  "reminders": [
    { "minutes": 5 },      // 提前5分钟
    { "minutes": 60 },     // 提前1小时
    { "minutes": 1440 },   // 提前1天
    { "minutes": 7200 }    // 提前5天
  ]
}
```

## 注意事项

1. **Token 有效期**: tenant_access_token 有效期 2 小时，生产环境需要缓存和刷新机制
2. **时间戳单位**: 飞书 API 使用 Unix 时间戳（秒），JavaScript Date 使用毫秒，注意转换
3. **时区处理**: 建议统一使用 `Asia/Shanghai` 时区
4. **全天事件**: 使用 `date` 字段而非 `timestamp`，并设置 `is_all_day: true`
5. **已取消事件**: API 会返回 `status: cancelled` 的事件，需要过滤
6. **分页处理**: 大量事件需要处理 `has_more` 和 `page_token`

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 99991661 - Missing access token | 检查 token 是否正确传递 |
| 403 - 权限不足 | 在飞书后台开通相应权限 |
| 事件查询不到 | 扩大时间范围，检查是否已取消 |
| 创建失败 | 检查必填字段（summary, start_time, end_time）|

## 参考文档

- [飞书日历 API 文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/calendar-v4/calendar/list)
- [获取 Access Token](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/authentication-management/auth-v3/auth-v3-tenant_access_token)
- [飞书开放平台](https://open.feishu.cn/)
