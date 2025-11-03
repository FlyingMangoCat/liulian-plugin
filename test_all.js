/**
 * 榴莲插件功能测试脚本
 * 测试所有主要功能模块是否正常工作
 */

import { AIManager } from './apps/ai/index.js';
import UserService from './apps/ai/core/user.js';
import DatabaseManager from './apps/ai/core/databaseMongo.js';

async function runAllTests() {
  console.log('开始测试榴莲插件所有功能...');
  
  // 1. 测试数据库连接
  console.log('\n1. 测试数据库连接...');
  try {
    const dbConnected = await DatabaseManager.connect();
    console.log('MongoDB连接:', dbConnected ? '成功' : '失败');
  } catch (error) {
    console.error('数据库连接测试失败:', error.message);
  }
  
  // 2. 测试用户服务
  console.log('\n2. 测试用户服务...');
  try {
    const testUserId = 'test_user_001';
    
    // 测试创建/更新通用用户
    const commonUser = await UserService.upsertCommonUser(testUserId, {
      username: '测试用户',
      nickname: '测试昵称'
    });
    console.log('创建通用用户:', commonUser ? '成功' : '失败');
    
    // 测试获取通用用户信息
    const userInfo = await UserService.getCommonUserInfo(testUserId);
    console.log('获取通用用户信息:', userInfo ? '成功' : '失败');
    
    // 测试AI用户数据
    const aiUserData = await UserService.getAIUserData(testUserId);
    console.log('获取AI用户数据:', aiUserData ? '成功' : '失败');
    
    // 测试增加好感度
    const newAffinity = await UserService.increaseAffinity(testUserId, 1);
    console.log('增加好感度:', typeof newAffinity === 'number' ? '成功' : '失败');
    
    // 测试获取用户等级信息
    const levelInfo = await UserService.getUserLevelInfo(testUserId);
    console.log('获取用户等级信息:', levelInfo ? '成功' : '失败');
  } catch (error) {
    console.error('用户服务测试失败:', error.message);
  }
  
  // 3. 测试数据库功能
  console.log('\n3. 测试数据库功能...');
  try {
    const testUserId = 'test_user_001';
    
    // 测试保存记忆
    const saveResult = await DatabaseManager.saveMemory(testUserId, '测试记忆内容', 'test');
    console.log('保存记忆:', saveResult ? '成功' : '失败');
    
    // 测试获取记忆
    const memories = await DatabaseManager.getMemories(testUserId, 5);
    console.log('获取记忆:', Array.isArray(memories) ? '成功' : '失败');
    
    // 测试重置记忆
    const resetResult = await DatabaseManager.resetUserMemories(testUserId);
    console.log('重置记忆:', resetResult ? '成功' : '失败');
  } catch (error) {
    console.error('数据库功能测试失败:', error.message);
  }
  
  // 4. 测试AI管理器
  console.log('\n4. 测试AI管理器...');
  try {
    // 检查AI服务是否可用
    const isAvailable = AIManager.isAIAvailable();
    console.log('AI服务可用性检查:', isAvailable !== undefined ? '成功' : '失败');
    
    // 获取配置
    const config = AIManager.getConfig();
    console.log('获取AI配置:', config ? '成功' : '失败');
    
    // 测试概率检查（模拟消息对象）
    const mockMessage = {
      isPrivate: true,
      at: false,
      msg: '测试消息'
    };
    const shouldReply = AIManager.shouldReply(mockMessage);
    console.log('概率检查:', typeof shouldReply === 'boolean' ? '成功' : '失败');
  } catch (error) {
    console.error('AI管理器测试失败:', error.message);
  }
  
  console.log('\n所有测试完成。');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };