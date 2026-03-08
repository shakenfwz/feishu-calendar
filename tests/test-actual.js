/**
 * 实际功能测试脚本
 * 验证从.env文件读取环境变量并测试所有主要功能
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

async function testAllFunctions() {
  console.log('🧪 开始测试飞书日历功能...');
  console.log('='.repeat(50));
  
  try {
    // 1. 测试获取 Access Token
    console.log('\n1. 测试获取 Access Token');
    console.log('-'.repeat(30));
    const token = await getAccessToken();
    console.log('✅ 获取 Access Token 成功:', token.substring(0, 20) + '...');
    
    // 2. 测试获取日历列表
    console.log('\n2. 测试获取日历列表');
    console.log('-'.repeat(30));
    const calendars = await getAllCalendars(token);
    console.log(`✅ 找到 ${calendars.length} 个日历`);
    calendars.forEach((calendar, index) => {
      console.log(`${index + 1}. ${calendar.summary} (${calendar.calendar_id})`);
      if (calendar.is_primary) {
        console.log(`   📅 主日历`);
      }
    });
    
    if (calendars.length === 0) {
      console.log('⚠️  没有找到日历，后续测试将跳过');
      return;
    }
    
    const primaryCalendar = calendars.find(c => c.is_primary) || calendars[0];
    console.log(`\n📆 使用日历: ${primaryCalendar.summary}`);
    
    // 3. 测试获取今日事件
    console.log('\n3. 测试获取今日事件');
    console.log('-'.repeat(30));
    const todayEvents = await getTodayEvents();
    console.log(`✅ 今日事件数量: ${todayEvents.events.length}`);
    if (todayEvents.events.length > 0) {
      todayEvents.events.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.summary}`);
        if (event.is_all_day) {
          console.log(`   📅 全天事件`);
        } else {
          console.log(`   ⏰ ${formatTime(parseInt(event.start_time.timestamp) * 1000)} - ${formatTime(parseInt(event.end_time.timestamp) * 1000)}`);
        }
        if (event.description) {
          console.log(`   📝 ${event.description}`);
        }
        if (event.location?.name) {
          console.log(`   📍 ${event.location.name}`);
        }
      });
    } else {
      console.log('📅 今天没有安排日程');
    }
    
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
    console.log('✅ 创建事件成功:', createdEvent);
    
    // 检查是否返回了event_id
    if (!createdEvent || !createdEvent.event_id) {
      console.log('⚠️  创建事件未返回event_id，跳过更新和删除测试');
    } else {
      console.log('✅ 事件ID:', createdEvent.event_id);
      
      // 更新测试事件
      const updateData = {
        summary: '测试事件（已更新）',
        description: '这是一个已更新的测试事件'
      };
      
      const updatedEvent = await updateEvent(token, primaryCalendar.calendar_id, createdEvent.event_id, updateData);
      console.log('✅ 更新事件成功');
      
      // 删除测试事件
      await deleteEvent(token, primaryCalendar.calendar_id, createdEvent.event_id);
      console.log('✅ 删除事件成功');
    }
    
    console.log('\n🎉 所有测试功能都已成功完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    console.error('详细错误:', error);
  }
  
  console.log('='.repeat(50));
  console.log('🧪 测试完成');
}

// 运行测试
testAllFunctions();
