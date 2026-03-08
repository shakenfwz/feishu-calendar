# Feishu Calendar API 参考

## 概述

本文档提供了飞书日历 API 的详细参考，包括所有支持的端点、请求参数和响应格式。

## 基础 URL

```
https://open.feishu.cn/open-apis
```

## 认证

所有 API 请求都需要在请求头中包含 `Authorization` 字段，格式为：

```
Authorization: Bearer {tenant_access_token}
```

## API 端点

### 1. 获取 Tenant Access Token

**端点**: `/auth/v3/tenant_access_token/internal`

**方法**: `POST`

**请求体**:

```json
{
  "app_id": "cli_xxxxxxxxxxxx",
  "app_secret": "xxxxxxxxxxxxx"
}
```

**响应**:

```json
{
  "code": 0,
  "msg": "success",
  "tenant_access_token": "t-xxxxxxxxxxxx",
  "expire": 7200
}
```

### 2. 获取日历列表

**端点**: `/calendar/v4/calendars`

**方法**: `GET`

**参数**:
- `page_size` (可选): 每页数量，默认 20，最大 100
- `page_token` (可选): 分页标记

**响应**:

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "calendar_list": [
      {
        "calendar_id": "cal_xxxxxxxxxxxx",
        "summary": "个人日历",
        "description": "个人日程管理",
        "color": "#52c41a",
        "is_primary": true,
        "owner": {
          "open_id": "ou_xxxxxxxxxxxx",
          "user_id": "xxxxxxxxxxxx",
          "name": "张三"
        }
      }
    ],
    "has_more": false,
    "page_token": ""
  }
}
```

### 3. 获取日程事件

**端点**: `/calendar/v4/calendars/{calendar_id}/events`

**方法**: `GET`

**参数**:
- `start_time`: 开始时间戳（秒）
- `end_time`: 结束时间戳（秒）
- `page_size` (可选): 每页数量，默认 20，最大 100
- `page_token` (可选): 分页标记

**响应**:

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "event_id": "evt_xxxxxxxxxxxx",
        "summary": "团队会议",
        "description": "每周团队例会",
        "start_time": {
          "timestamp": "1772366400",
          "timezone": "Asia/Shanghai"
        },
        "end_time": {
          "timestamp": "1772373600",
          "timezone": "Asia/Shanghai"
        },
        "is_all_day": false,
        "status": "confirmed",
        "location": {
          "name": "会议室 A"
        },
        "reminders": [
          { "minutes": 15 }
        ],
        "recurrence": "FREQ=WEEKLY;INTERVAL=1"
      }
    ],
    "has_more": false,
    "page_token": ""
  }
}
```

### 4. 创建日程

**端点**: `/calendar/v4/calendars/{calendar_id}/events`

**方法**: `POST`

**请求体**:

```json
{
  "summary": "项目启动会",
  "description": "讨论项目计划和分工",
  "start_time": {
    "timestamp": "1772366400",
    "timezone": "Asia/Shanghai"
  },
  "end_time": {
    "timestamp": "1772373600",
    "timezone": "Asia/Shanghai"
  },
  "is_all_day": false,
  "location": {
    "name": "会议室 B"
  },
  "reminders": [
    { "minutes": 30 },
    { "minutes": 1440 }
  ],
  "recurrence": "FREQ=WEEKLY;INTERVAL=1"
}
```

**响应**:

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "event_id": "evt_xxxxxxxxxxxx",
    "summary": "项目启动会",
    "start_time": {
      "timestamp": "1772366400",
      "timezone": "Asia/Shanghai"
    },
    "end_time": {
      "timestamp": "1772373600",
      "timezone": "Asia/Shanghai"
    }
  }
}
```

### 5. 更新日程

**端点**: `/calendar/v4/calendars/{calendar_id}/events/{event_id}`

**方法**: `PATCH`

**请求体**:

```json
{
  "summary": "项目启动会（更新）",
  "description": "讨论项目计划、分工和时间线",
  "reminders": [
    { "minutes": 60 },
    { "minutes": 1440 }
  ]
}
```

**响应**:

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "event_id": "evt_xxxxxxxxxxxx",
    "summary": "项目启动会（更新）",
    "description": "讨论项目计划、分工和时间线",
    "start_time": {
      "timestamp": "1772366400",
      "timezone": "Asia/Shanghai"
    },
    "end_time": {
      "timestamp": "1772373600",
      "timezone": "Asia/Shanghai"
    }
  }
}
```

### 6. 删除日程

**端点**: `/calendar/v4/calendars/{calendar_id}/events/{event_id}`

**方法**: `DELETE`

**响应**:

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

## 时间格式

### 全天事件

```json
{
  "start_time": { "date": "2026-05-01", "timezone": "Asia/Shanghai" },
  "end_time": { "date": "2026-05-01", "timezone": "Asia/Shanghai" },
  "is_all_day": true
}
```

### 定时事件

```json
{
  "start_time": { "timestamp": "1772366400", "timezone": "Asia/Shanghai" },
  "end_time": { "timestamp": "1772373600", "timezone": "Asia/Shanghai" }
}
```

## 重复规则

| 规则 | 说明 |
|------|------|
| `FREQ=DAILY;INTERVAL=1` | 每天重复 |
| `FREQ=WEEKLY;INTERVAL=1` | 每周重复 |
| `FREQ=MONTHLY;INTERVAL=1` | 每月重复 |
| `FREQ=YEARLY;INTERVAL=1` | 每年重复 |

## 提醒设置

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

## 错误代码

| 代码 | 描述 | 解决方案 |
|------|------|----------|
| 99991661 | Missing access token | 检查 token 是否正确传递 |
| 403 | 权限不足 | 在飞书后台开通相应权限 |
| 1066405 | 参数错误 | 检查请求参数是否正确 |
| 1066406 | 资源不存在 | 检查日历 ID 或事件 ID 是否正确 |

## 最佳实践

1. **Token 管理**: 实现 Token 缓存和自动刷新机制，避免频繁请求
2. **错误处理**: 妥善处理 API 错误，提供友好的错误提示
3. **分页处理**: 处理 `has_more` 和 `page_token`，确保获取完整数据
4. **时区处理**: 统一使用 `Asia/Shanghai` 时区，避免时间混乱
5. **事件过滤**: 过滤 `status: cancelled` 的事件，只显示有效事件
6. **API 频率限制**: 实现限流机制，避免超过飞书 API 的调用频率限制
7. **输入验证**: 对所有输入参数进行验证，确保数据完整性
8. **配置管理**: 使用环境变量或平台配置管理敏感信息，避免硬编码

## 客户端库使用说明

项目提供了一个完整的客户端库 `scripts/calendar-client.js`，封装了所有 API 调用细节：

### 主要功能

- **Token 管理**: 自动处理 Token 的获取、缓存和刷新
- **分页处理**: 自动处理 `has_more` 和 `page_token`，获取完整数据
- **错误处理**: 统一的错误处理和提示
- **API 频率限制**: 内置限流机制，避免超过 API 调用限制
- **输入验证**: 对所有输入参数进行验证
- **时区支持**: 内置时区处理功能

### 导出的函数

- `getAccessToken()`: 获取访问令牌
- `getCalendars(accessToken, pageToken)`: 获取日历列表（单页）
- `getAllCalendars(accessToken)`: 获取所有日历（自动分页）
- `getEvents(accessToken, calendarId, startTime, endTime, pageToken)`: 获取事件列表（单页）
- `getAllEvents(accessToken, calendarId, startTime, endTime)`: 获取所有事件（自动分页）
- `createEvent(accessToken, calendarId, eventData)`: 创建事件
- `updateEvent(accessToken, calendarId, eventId, updateData)`: 更新事件
- `deleteEvent(accessToken, calendarId, eventId)`: 删除事件
- `formatTime(date, timezone)`: 格式化时间
- `getTodayEvents(timezone)`: 获取今天的所有日程（简化方法）

### 使用示例

```javascript
const { getTodayEvents } = require('../scripts/calendar-client');

// 获取今天的日程
getTodayEvents().then(result => {
  console.log('今日日程:', result.events);
}).catch(console.error);
```
