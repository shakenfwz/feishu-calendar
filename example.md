# 飞书日历 API 调用示例
# 获取今天的日程

## 步骤说明

### 1. 获取 Access Token

使用 web_fetch 工具调用飞书认证接口：

```javascript
{
  "url": "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "app_id": "cli_xxxxxxxxxxxx",
    "app_secret": "xxxxxxxxxxxxx"
  }
}
```

### 2. 从响应中提取 tenant_access_token

返回格式：
```json
{
  "code": 0,
  "msg": "ok",
  "tenant_access_token": "t-xxx",
  "expire": 7200
}
```

### 3. 获取日历列表

```javascript
{
  "url": "https://open.feishu.cn/open-apis/calendar/v4/calendars?page_size=100",
  "headers": {
    "Authorization": "Bearer t-xxx"
  }
}
```

### 4. 处理分页（如果需要）

如果日历数量超过100，需要处理分页：

```javascript
// 检查响应中的 has_more 字段
if (response.data.has_more) {
  // 使用 page_token 获取下一页
  const nextPage = await fetch(
    `https://open.feishu.cn/open-apis/calendar/v4/calendars?page_size=100&page_token=${response.data.page_token}`,
    {
      headers: {
        "Authorization": "Bearer t-xxx"
      }
    }
  );
}
```

### 5. 获取特定日历的事件

```javascript
// 注意：飞书 API 需要 Unix 时间戳（秒）
const startTime = Math.floor(new Date('2026-03-01T00:00:00+08:00').getTime() / 1000);
const endTime = Math.floor(new Date('2026-03-01T23:59:59+08:00').getTime() / 1000);

{
  "url": `https://open.feishu.cn/open-apis/calendar/v4/calendars/{calendar_id}/events?start_time=${startTime}&end_time=${endTime}&page_size=100`,
  "headers": {
    "Authorization": "Bearer t-xxx"
  }
}
```

### 6. 处理事件分页（如果需要）

如果事件数量超过100，同样需要处理分页：

```javascript
// 检查响应中的 has_more 字段
if (response.data.has_more) {
  // 使用 page_token 获取下一页
  const nextPage = await fetch(
    `https://open.feishu.cn/open-apis/calendar/v4/calendars/{calendar_id}/events?start_time=${startTime}&end_time=${endTime}&page_size=100&page_token=${response.data.page_token}`,
    {
      headers: {
        "Authorization": "Bearer t-xxx"
      }
    }
  );
}
```

### 7. 创建日程

```javascript
{
  "url": "https://open.feishu.cn/open-apis/calendar/v4/calendars/{calendar_id}/events",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer t-xxx",
    "Content-Type": "application/json"
  },
  "body": {
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
}
```

### 8. 更新日程

```javascript
{
  "url": "https://open.feishu.cn/open-apis/calendar/v4/calendars/{calendar_id}/events/{event_id}",
  "method": "PATCH",
  "headers": {
    "Authorization": "Bearer t-xxx",
    "Content-Type": "application/json"
  },
  "body": {
    "summary": "项目启动会（更新）",
    "description": "讨论项目计划、分工和时间线",
    "reminders": [
      { "minutes": 60 },
      { "minutes": 1440 }
    ]
  }
}
```

### 9. 删除日程

```javascript
{
  "url": "https://open.feishu.cn/open-apis/calendar/v4/calendars/{calendar_id}/events/{event_id}",
  "method": "DELETE",
  "headers": {
    "Authorization": "Bearer t-xxx"
  }
}
```

## 响应格式

### 日历列表示例：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "calendar_list": [
      {
        "calendar_id": "feishu.cn_xxx",
        "summary": "我的日历",
        "description": "",
        "is_primary": true
      }
    ],
    "has_more": false,
    "page_token": ""
  }
}
```

### 事件列表示例：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "items": [
      {
        "event_id": "xxx",
        "summary": "会议标题",
        "description": "会议描述",
        "start_time": {
          "timestamp": "1709251200",
          "timezone": "Asia/Shanghai"
        },
        "end_time": {
          "timestamp": "1709254800",
          "timezone": "Asia/Shanghai"
        },
        "location": {
          "name": "会议室"
        },
        "reminders": [
          { "minutes": 15 }
        ],
        "recurrence": "FREQ=WEEKLY;INTERVAL=1",
        "status": "confirmed"
      }
    ],
    "has_more": false,
    "page_token": ""
  }
}
```

## 注意事项

1. **Token 管理**：tenant_access_token 有效期 2 小时，建议实现缓存和自动刷新机制
2. **时间戳格式**：飞书 API 使用 Unix 时间戳（秒），JavaScript Date 使用毫秒，注意转换
3. **分页处理**：日历和事件列表都需要处理 `has_more` 和 `page_token`
4. **主日历识别**：主日历的 `is_primary` 为 true
5. **事件状态**：API 会返回 `status: cancelled` 的事件，需要过滤
6. **重复规则**：支持 `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY;INTERVAL=1` 格式
7. **提醒设置**：支持多个提醒时间，单位为分钟
8. **时区处理**：建议统一使用 `Asia/Shanghai` 时区
9. **API 频率限制**：飞书 API 有调用频率限制，建议实现限流机制
10. **错误处理**：妥善处理 API 错误，根据错误码采取相应措施

## 完整示例代码

### 使用项目提供的客户端

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

// 示例1: 获取今天的日程
getTodayEvents().then(result => {
  console.log('\n📋 今日日程:');
  console.log('================');
  if (result.events.length === 0) {
    console.log('今天没有安排日程');
  } else {
    result.events.forEach(event => {
      let start, end;
      if (event.is_all_day) {
        start = event.start_time.date;
        end = event.end_time.date;
      } else {
        start = formatTime(parseInt(event.start_time.timestamp) * 1000);
        end = formatTime(parseInt(event.end_time.timestamp) * 1000);
      }
      console.log(`\n📝 ${event.summary}`);
      console.log(`   时间: ${start} - ${end}`);
      if (event.description) console.log(`   描述: ${event.description}`);
      if (event.location?.name) console.log(`   地点: ${event.location.name}`);
      if (event.reminders?.length) {
        console.log(`   提醒: ${event.reminders.map(r => `${r.minutes}分钟`).join(', ')}`);
      }
      if (event.recurrence) console.log(`   重复: ${event.recurrence}`);
    });
  }
}).catch(console.error);

// 示例2: 创建一个新事件
async function createNewEvent() {
  try {
    const token = await getAccessToken();
    const calendars = await getAllCalendars(token);
    const primaryCalendar = calendars.find(c => c.is_primary) || calendars[0];
    
    const eventData = {
      summary: '项目启动会',
      description: '讨论项目计划和分工',
      start_time: {
        timestamp: Math.floor(new Date('2026-03-15T10:00:00+08:00').getTime() / 1000),
        timezone: 'Asia/Shanghai'
      },
      end_time: {
        timestamp: Math.floor(new Date('2026-03-15T11:30:00+08:00').getTime() / 1000),
        timezone: 'Asia/Shanghai'
      },
      is_all_day: false,
      location: {
        name: '会议室 B'
      },
      reminders: [
        { minutes: 30 },
        { minutes: 1440 }
      ],
      recurrence: 'FREQ=WEEKLY;INTERVAL=1'
    };
    
    const newEvent = await createEvent(token, primaryCalendar.calendar_id, eventData);
    console.log('✅ 事件创建成功:', newEvent.event_id);
    
    return newEvent;
  } catch (error) {
    console.error('❌ 创建事件失败:', error.message);
  }
}

// 调用示例
// createNewEvent();
```

### OpenClaw 平台集成

在 OpenClaw 平台中使用时，无需手动设置环境变量，只需在平台配置中设置：

```
channels.feishu.appId: "cli_xxxxxxxxxxxx"
channels.feishu.appSecret: "xxxxxxxxxxxxx"
```

技能会自动从平台配置中读取这些参数，无需额外配置。