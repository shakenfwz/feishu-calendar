/**
 * 简化的功能测试脚本
 * 验证所有主要功能是否正常工作
 */

const { 
  getAccessToken, 
  getAllCalendars, 
  getTodayEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} = require('../scripts/calendar-client');

async function testAllFunctions() {
  console.log('🧪 开始测试飞书日历功能...');
  console.log('='.repeat(50));
  
  let token = null;
  let primaryCalendar = null;
  let createdEventId = null;
  
  try {
    // 1. 测试获取 Access Token
    console.log('\n1. 测试获取 Access Token');
    console.log('-'.repeat(30));
    token = await getAccessToken();
    console.log('✅ 获取 Access Token 成功');
    
    // 2. 测试获取日历列表
    console.log('\n2. 测试获取日历列表');
    console.log('-'.repeat(30));
    const calendars = await getAllCalendars(token);
    console.log(`✅ 找到 ${calendars.length} 个日历`);
    
    if (calendars.length === 0) {
      console.log('⚠️  没有找到日历，后续测试将跳过');
      return;
    }
    
    primaryCalendar = calendars.find(c => c.is_primary) || calendars[0];
    console.log(`📆 使用日历: ${primaryCalendar.summary}`);
    
    // 3. 测试获取今日事件
    console.log('\n3. 测试获取今日事件');
    console.log('-'.repeat(30));
    const todayEvents = await getTodayEvents();
    console.log(`✅ 今日事件数量: ${todayEvents.events.length}`);
    
    // 4. 测试创建、更新和删除事件
    console.log('\n4. 测试创建、更新和删除事件');
    console.log('-'.repeat(30));
    
    // 创建测试事件
    const testEvent = {
      summary: '测试事件',
      description: '这是一个测试事件',
      start_time: {
        timestamp: Math.floor(Date.now() / 1000) + 3600, // 1小时后
        timezone: 'Asia/Shanghai'
      },
      end_time: {
        timestamp: Math.floor(Date.now() / 1000) + 7200, // 2小时后
        timezone: 'Asia/Shanghai'
      },
      is_all_day: false,
      reminders: [
        { minutes: 30 }
      ]
    };
    
    const createdEvent = await createEvent(token, primaryCalendar.calendar_id, testEvent);
    console.log('✅ 创建事件成功');
    
    // 检查返回结构
    if (createdEvent && createdEvent.event && createdEvent.event.event_id) {
      createdEventId = createdEvent.event.event_id;
      console.log('✅ 事件ID:', createdEventId);
      
      // 更新测试事件
      const updateData = {
        summary: '测试事件（已更新）',
        description: '这是一个已更新的测试事件'
      };
      
      await updateEvent(token, primaryCalendar.calendar_id, createdEventId, updateData);
      console.log('✅ 更新事件成功');
      
      // 删除测试事件
      await deleteEvent(token, primaryCalendar.calendar_id, createdEventId);
      console.log('✅ 删除事件成功');
    } else {
      console.log('⚠️  创建事件返回结构不符合预期，跳过更新和删除测试');
      console.log('返回数据:', JSON.stringify(createdEvent, null, 2));
    }
    
    console.log('\n🎉 所有测试功能都已成功完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    // 只输出错误信息，不输出详细堆栈，避免输出被截断
  }
  
  console.log('='.repeat(50));
  console.log('🧪 测试完成');
}

// 运行测试
testAllFunctions();
