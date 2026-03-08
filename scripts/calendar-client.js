/**
 * Feishu Calendar API Client
 * 飞书日历 API 客户端
 */

// 从环境变量或 OpenClaw 平台配置读取配置
function getConfig() {
  // 尝试从多个来源读取配置
  let appId = process.env.FEISHU_APP_ID;
  let appSecret = process.env.FEISHU_APP_SECRET;
  
  // 尝试从 OpenClaw 平台的 channels.feishu 配置读取
  if (!appId || !appSecret) {
    // 检查 OpenClaw 平台可能的配置格式
    appId = appId || process.env['channels.feishu.appId'] || process.env.CHANNELS_FEISHU_APPID || process.env.CHANNELS_FEISHU_APP_ID;
    appSecret = appSecret || process.env['channels.feishu.appSecret'] || process.env.CHANNELS_FEISHU_APPSECRET || process.env.CHANNELS_FEISHU_APP_SECRET;
  }
  
  return {
    appId: appId,
    appSecret: appSecret,
    baseUrl: 'https://open.feishu.cn/open-apis'
  };
}

const FEISHU_CONFIG = getConfig();

// Token 缓存
let tokenCache = {
  token: null,
  expireTime: 0
};

// API 调用频率限制
const rateLimit = {
  calls: [],
  limit: 100, // 每分钟最大调用次数
  windowMs: 60000 // 时间窗口（毫秒）
};

/**
 * 检查配置是否完整
 */
function checkConfig() {
  const config = getConfig();
  if (!config.appId || !config.appSecret) {
    throw new Error('请配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量');
  }
  return config;
}

/**
 * 检查 API 调用频率
 */
async function checkRateLimit() {
  const now = Date.now();
  // 清理过期的调用记录
  rateLimit.calls = rateLimit.calls.filter(timestamp => now - timestamp < rateLimit.windowMs);
  
  if (rateLimit.calls.length >= rateLimit.limit) {
    // 计算需要等待的时间
    const oldestCall = rateLimit.calls[0];
    const waitTime = rateLimit.windowMs - (now - oldestCall);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // 记录本次调用
  rateLimit.calls.push(now);
}

/**
 * 验证输入参数
 */
function validateParams(params, required) {
  for (const param of required) {
    if (!params[param]) {
      throw new Error(`缺少必要参数: ${param}`);
    }
  }
}

/**
 * 获取 tenant_access_token
 */
async function getAccessToken() {
  const config = checkConfig();
  
  // 检查缓存的 token 是否有效
  const now = Date.now();
  if (tokenCache.token && tokenCache.expireTime > now) {
    console.log('✅ 使用缓存的 Access Token');
    return tokenCache.token;
  }
  
  await checkRateLimit();
  
  console.log('🔄 获取新的 Access Token');
  const response = await fetch(`${config.baseUrl}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret
    })
  });
  
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取 Token 失败: ${data.msg}`);
  }
  
  // 缓存 token，设置过期时间（留10分钟缓冲）
  tokenCache.token = data.tenant_access_token;
  tokenCache.expireTime = now + (data.expire - 600) * 1000;
  
  return data.tenant_access_token;
}

/**
 * 获取日历列表
 */
async function getCalendars(accessToken, pageToken = '') {
  await checkRateLimit();
  const config = getConfig();
  
  let url = `${config.baseUrl}/calendar/v4/calendars?page_size=100`;
  if (pageToken) {
    url += `&page_token=${pageToken}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取日历失败: ${data.msg}`);
  }
  
  return {
    calendars: data.data.calendar_list,
    hasMore: data.data.has_more,
    pageToken: data.data.page_token
  };
}

/**
 * 获取所有日历（处理分页）
 */
async function getAllCalendars(accessToken) {
  let allCalendars = [];
  let pageToken = '';
  let hasMore = true;
  
  while (hasMore) {
    const result = await getCalendars(accessToken, pageToken);
    if (result && result.calendars) {
      allCalendars = allCalendars.concat(result.calendars);
      hasMore = result.hasMore;
      pageToken = result.pageToken;
    } else {
      hasMore = false;
    }
  }
  
  return allCalendars;
}

/**
 * 获取日历事件
 */
async function getEvents(accessToken, calendarId, startTime, endTime, pageToken = '') {
  validateParams({ calendarId, startTime, endTime }, ['calendarId', 'startTime', 'endTime']);
  
  await checkRateLimit();
  const config = getConfig();
  
  // 飞书 API 需要 Unix 时间戳（秒）
  const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
  
  let url = `${config.baseUrl}/calendar/v4/calendars/${calendarId}/events?` +
    `start_time=${startTimestamp}&` +
    `end_time=${endTimestamp}&` +
    `page_size=100`;
  
  if (pageToken) {
    url += `&page_token=${pageToken}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`获取事件失败: ${data.msg}`);
  }
  
  return {
    events: data.data.items || [],
    hasMore: data.data.has_more,
    pageToken: data.data.page_token
  };
}

/**
 * 获取所有事件（处理分页）
 */
async function getAllEvents(accessToken, calendarId, startTime, endTime) {
  let allEvents = [];
  let pageToken = '';
  let hasMore = true;
  
  while (hasMore) {
    const result = await getEvents(accessToken, calendarId, startTime, endTime, pageToken);
    allEvents = allEvents.concat(result.events);
    hasMore = result.hasMore;
    pageToken = result.pageToken;
  }
  
  // 过滤已取消的事件
  return allEvents.filter(event => event.status !== 'cancelled');
}

/**
 * 创建日历事件
 */
async function createEvent(accessToken, calendarId, eventData) {
  validateParams({ calendarId, eventData }, ['calendarId', 'eventData']);
  validateParams(eventData, ['summary', 'start_time', 'end_time']);
  
  await checkRateLimit();
  const config = getConfig();
  
  const response = await fetch(`${config.baseUrl}/calendar/v4/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });
  
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`创建事件失败: ${data.msg}`);
  }
  
  return data.data;
}

/**
 * 更新日历事件
 */
async function updateEvent(accessToken, calendarId, eventId, updateData) {
  validateParams({ calendarId, eventId, updateData }, ['calendarId', 'eventId', 'updateData']);
  
  await checkRateLimit();
  const config = getConfig();
  
  const response = await fetch(`${config.baseUrl}/calendar/v4/calendars/${calendarId}/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`更新事件失败: ${data.msg}`);
  }
  
  return data.data;
}

/**
 * 删除日历事件
 */
async function deleteEvent(accessToken, calendarId, eventId) {
  validateParams({ calendarId, eventId }, ['calendarId', 'eventId']);
  
  await checkRateLimit();
  const config = getConfig();
  
  const response = await fetch(`${config.baseUrl}/calendar/v4/calendars/${calendarId}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`删除事件失败: ${data.msg}`);
  }
  
  return data.data;
}

/**
 * 格式化时间，支持不同时区
 */
function formatTime(date, timezone = 'Asia/Shanghai') {
  return new Date(date).toLocaleString('zh-CN', { timeZone: timezone });
}

/**
 * 获取今天的所有日程
 */
async function getTodayEvents(timezone = 'Asia/Shanghai') {
  try {
    // 1. 获取 access token
    const token = await getAccessToken();
    console.log('✅ 获取 Access Token 成功');
    
    // 2. 获取日历列表
    const calendars = await getAllCalendars(token);
    console.log(`📅 找到 ${calendars.length} 个日历`);
    
    // 3. 获取今天的时间范围
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const startTime = `${year}-${month}-${day}T00:00:00+08:00`;
    const endTime = `${year}-${month}-${day}T23:59:59+08:00`;
    
    // 4. 获取主日历的事件
    const primaryCalendar = calendars.find(c => c.is_primary) || calendars[0];
    console.log(`📆 使用日历: ${primaryCalendar.summary}`);
    
    const events = await getAllEvents(token, primaryCalendar.calendar_id, startTime, endTime);
    
    return {
      calendar: primaryCalendar,
      events: events,
      date: `${year}-${month}-${day}`,
      timezone: timezone
    };
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  }
}

// 导出函数
module.exports = {
  getAccessToken,
  getCalendars,
  getAllCalendars,
  getEvents,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  formatTime,
  getTodayEvents,
  tokenCache
};

// 如果直接运行脚本
if (require.main === module) {
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
}
