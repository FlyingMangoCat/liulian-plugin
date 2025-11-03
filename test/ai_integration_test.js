/**
 * AI模块集成测试文件
 * 用于验证用户系统集成是否正常工作
 */

import { AIManager } from '../apps/ai/index.js';
import UserService from '../apps/ai/core/user.js';
import DatabaseManager from '../apps/ai/core/database.js';

// 测试函数
async function runIntegrationTest() {
  console.log('开始AI模块集成测试...');
  
  // 1. 测试数据库连接
  console.log('\n1. 测试数据库连接...');
  const dbConnected = await DatabaseManager.connect();
  console.log('数据库连接状态:', dbConnected ? '成功' : '失败');
  
  // 2. 测试用户服务
  console.log('\n2. 测试用户服务...');
  try {
    // 创建测试用户
    const testUserId = 'test_user_001';
    const testUserData = {
      username: '测试用户',
      level: 5,
      experience: 1000,
      role: 'user'
    };
    
    const user = await UserService.upsertUser(testUserId, testUserData);
    console.log('创建/更新用户:', user ? '成功' : '失败');
    
    // 获取用户信息
    const userInfo = await UserService.getUserLevelInfo(testUserId);
    console.log('用户信息:', userInfo);
    
    // 检查权限
    const hasPermission = await UserService.hasPermission(testUserId, 'user');
    console.log('用户权限检查:', hasPermission ? '通过' : '失败');
  } catch (error) {
    console.error('用户服务测试失败:', error.message);
  }
  
  // 3. 测试记忆功能
  console.log('\n3. 测试记忆功能...');
  try {
    if (DatabaseManager.isConnected) {
      const testUserId = 'test_user_001';
      
      // 保存记忆
      const saveResult = await DatabaseManager.saveMemory(
        testUserId, 
        '这是测试记忆内容', 
        'test'
      );
      console.log('保存记忆:', saveResult ? '成功' : '失败');
      
      // 获取记忆
      const memories = await DatabaseManager.getMemories(testUserId, 5);
      console.log('获取记忆:', memories);
      
      // 重置记忆
      const resetResult = await DatabaseManager.resetUserMemories(testUserId);
      console.log('重置记忆:', resetResult ? '成功' : '失败');
    } else {
      console.log('数据库未连接，跳过记忆功能测试');
    }
  } catch (error) {
    console.error('记忆功能测试失败:', error.message);
  }
  
  // 4. 测试AI处理
  console.log('\n4. 测试AI处理...');
  try {
    // 模拟AI服务状态
    const originalIsAIAvailable = AIManager.isAIAvailable;
    AIManager.isAIAvailable = () => true;
    
    const testMessage = '你好，这是一个测试消息';
    const testUserId = 'test_user_001';
    
    const result = await AIManager.processMessage(testMessage, 'text', testUserId);
    console.log('AI处理结果:', result.success ? '成功' : '失败');
    
    // 恢复原始函数
    AIManager.isAIAvailable = originalIsAIAvailable;
  } catch (error) {
    console.error('AI处理测试失败:', error.message);
  }
  
  console.log('\n集成测试完成。');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTest().catch(console.error);
}

export { runIntegrationTest };