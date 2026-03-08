/**
 * 日历客户端单元测试
 */

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
} = require('../scripts/calendar-client');

// 模拟 fetch 函数
const originalFetch = global.fetch;
global.fetch = jest.fn();

// 模拟环境变量
process.env.FEISHU_APP_ID = 'test_app_id';
process.env.FEISHU_APP_SECRET = 'test_app_secret';

describe('Feishu Calendar Client', () => {
  beforeEach(() => {
    // 重置 fetch 模拟
    global.fetch.mockClear();
    // 清除 token 缓存
    const calendarClient = require('../scripts/calendar-client');
    calendarClient.tokenCache.token = null;
    calendarClient.tokenCache.expireTime = 0;
  });

  afterAll(() => {
    // 恢复原始 fetch
    global.fetch = originalFetch;
  });

  describe('getAccessToken', () => {
    it('应该成功获取 token', async () => {
      // 模拟响应
      global.fetch.mockResolvedValue({
        json: async () => ({
          code: 0,
          msg: 'success',
          tenant_access_token: 'test_token',
          expire: 7200
        })
      });

      const token = await getAccessToken();
      expect(token).toBe('test_token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('应该在获取 token 失败时抛出错误', async () => {
      // 模拟失败响应
      global.fetch.mockResolvedValue({
        json: async () => ({
          code: 400,
          msg: 'invalid app id'
        })
      });

      await expect(getAccessToken()).rejects.toThrow('获取 Token 失败: invalid app id');
    });
  });

  describe('getCalendars', () => {
    it('应该成功获取日历列表', async () => {
      // 模拟响应
      global.fetch.mockResolvedValue({
        json: async () => ({
          code: 0,
          msg: 'success',
          data: {
            calendar_list: [
              {
                calendar_id: 'cal_1',
                summary: '个人日历',
                is_primary: true
              }
            ],
            has_more: false,
            page_token: ''
          }
        })
      });

      const result = await getCalendars('test_token');
      expect(result.calendars).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEvents', () => {
    it('应该成功获取事件列表', async () => {
      // 模拟响应
      global.fetch.mockResolvedValue({
        json: async () => ({
          code: 0,
          msg: 'success',
          data: {
            items: [
              {
                event_id: 'evt_1',
                summary: '测试事件',
                start_time: { timestamp: '1772366400' },
                end_time: { timestamp: '1772373600' }
              }
            ],
            has_more: false,
            page_token: ''
          }
        })
      });

      const result = await getEvents('test_token', 'cal_1', '2026-03-01', '2026-03-02');
      expect(result.events).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('应该在缺少参数时抛出错误', async () => {
      await expect(getEvents('test_token', 'cal_1')).rejects.toThrow('缺少必要参数: startTime');
    });
  });

  describe('formatTime', () => {
    it('应该正确格式化时间', () => {
      const date = new Date('2026-03-01T12:00:00');
      const formatted = formatTime(date);
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getTodayEvents', () => {
    it('应该成功获取今日事件', async () => {
      // 模拟获取 token
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          code: 0,
          msg: 'success',
          tenant_access_token: 'test_token',
          expire: 7200
        })
      });

      // 模拟获取日历列表
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          code: 0,
          msg: 'success',
          data: {
            calendar_list: [
              {
                calendar_id: 'cal_1',
                summary: '个人日历',
                is_primary: true
              }
            ],
            has_more: false,
            page_token: ''
          }
        })
      });

      // 模拟获取事件列表
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          code: 0,
          msg: 'success',
          data: {
            items: [],
            has_more: false,
            page_token: ''
          }
        })
      });

      const result = await getTodayEvents();
      expect(result).toHaveProperty('calendar');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('date');
    });
  });
});
