/**
 * 简单的AI模块测试脚本
 * 用于验证基本功能是否正常工作
 */

// 模拟环境变量
process.env.LIULIAN_MODE = 'middleware';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

import { handleMiddlewareRequest } from './apps/ai.js';

async function runSimpleTest() {
  console.log('开始简单测试...');
  
  // 模拟请求数据
  const testData = {
    message: '你好，测试一下',
    user_id: 'test_user_123',
    message_type: 'text'
  };
  
  try {
    // 调用处理函数
    const result = await handleMiddlewareRequest(testData);
    console.log('处理结果:', result);
    
    if (result.success) {
      console.log('✅ 测试通过');
    } else {
      console.log('❌ 测试失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
  }
  
  console.log('测试完成。');
}

// 运行测试
runSimpleTest().catch(console.error);