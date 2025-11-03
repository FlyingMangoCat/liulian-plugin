/**
 * 自动推送更新到Gitee仓库脚本
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function autoPush() {
  try {
    console.log('开始推送更新到Gitee仓库...');
    
    // 添加所有更改的文件
    await execPromise('git add .');
    console.log('已添加所有更改的文件');
    
    // 提交更改
    const date = new Date().toLocaleString('zh-CN');
    await execPromise(`git commit -m "Auto update: ${date}"`);
    console.log('已提交更改');
    
    // 推送到Gitee
    await execPromise('git push gitee master');
    console.log('已推送到Gitee仓库');
    
    console.log('推送完成！');
  } catch (error) {
    console.error('推送过程中出现错误:', error.message);
  }
}

// 如果直接运行此脚本，则执行推送
if (import.meta.url === `file://${process.argv[1]}`) {
  autoPush();
}

export { autoPush };