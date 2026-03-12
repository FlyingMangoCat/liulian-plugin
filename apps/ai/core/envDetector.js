/**
 * 环境检测器 - 检测和配置Python AI框架环境
 * 
 * 功能说明：
 * 1. 检测系统是否已安装Python环境
 * 2. 检测Python环境是否满足AI框架要求
 * 3. 提供Python环境自动配置功能（预留接口）
 * 4. 管理临时会话，处理用户确认操作
 * 
 * 使用场景：
 * - 用户开启AI功能时，自动检测Python环境
 * - 如果环境不存在，提示用户是否自动配置
 * - 用户确认后，自动下载并配置Python环境
 * 
 * 注意事项：
 * - 目前Python环境配置功能为预留，具体实现待定
 * - 优先使用系统Python，其次使用打包的Python环境
 * - 自动设置文件执行权限（Linux/Mac系统）
 * - 提供详细的进度提示，让用户了解配置状态
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * 临时会话存储
 * 用于记录用户正在进行的操作，支持超时自动清理
 * 
 * 存储格式：
 * {
 *   userId: {
 *     type: 'python_setup' | 'python_upgrade',
 *     timestamp: Date.now(),
 *     metadata: {}
 *   }
 * }
 */
const pendingActions = new Map();

/**
 * 会话超时时间（毫秒）
 * 默认30秒后自动清理未确认的会话
 */
const SESSION_TIMEOUT = 30 * 1000;

/**
 * 环境检测器类
 */
class EnvironmentDetector {
  constructor() {
    this.pythonPath = null;
    this.pythonVersion = null;
    this.platform = process.platform;
  }

  /**
   * 检测Python环境
   * 
   * 检测顺序：
   * 1. 打包的Python环境（node_modules/liulian-python-env）
   * 2. 系统Python（python命令）
   * 3. 系统Python3（python3命令）
   * 
   * @returns {Promise<boolean>} 是否检测到可用的Python环境
   */
  async detectPython() {
    const possiblePaths = [
      // 1. 打包的Python环境
      this.getPackagedPythonPath(),
      // 2. 系统Python
      'python',
      // 3. 系统Python3（Linux/Mac）
      'python3'
    ];

    for (const pythonPath of possiblePaths) {
      if (pythonPath && await this.testPython(pythonPath)) {
        this.pythonPath = pythonPath;
        console.log(`[环境检测] 找到Python环境: ${pythonPath}`);
        return true;
      }
    }

    console.log('[环境检测] 未找到可用的Python环境');
    return false;
  }

  /**
   * 获取打包的Python环境路径
   * 
   * @returns {string|null} Python可执行文件路径，如果不存在返回null
   */
  getPackagedPythonPath() {
    const targetDir = path.join(process.cwd(), 'node_modules', 'liulian-python-env');
    
    if (!fs.existsSync(targetDir)) {
      return null;
    }

    const pythonPath = this.platform === 'win32'
      ? path.join(targetDir, 'python', 'python.exe')
      : path.join(targetDir, 'python', 'bin', 'python');

    if (fs.existsSync(pythonPath)) {
      return pythonPath;
    }

    return null;
  }

  /**
   * 测试Python是否可用
   * 
   * @param {string} pythonPath - Python可执行文件路径
   * @returns {Promise<boolean>} Python是否可用
   */
  async testPython(pythonPath) {
    return new Promise((resolve) => {
      const testProcess = spawn(pythonPath, ['--version'], {
        shell: this.platform === 'win32' // Windows需要shell支持
      });

      let output = '';
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0 && output) {
          // 解析Python版本号
          const versionMatch = output.match(/Python (\d+\.\d+\.\d+)/);
          if (versionMatch) {
            this.pythonVersion = versionMatch[1];
            console.log(`[环境检测] Python版本: ${this.pythonVersion}`);
          }
          resolve(true);
        } else {
          resolve(false);
        }
      });

      testProcess.on('error', (error) => {
        console.error(`[环境检测] Python测试失败: ${error.message}`);
        resolve(false);
      });
    });
  }

  /**
   * 下载并配置Python环境
   * 
   * 功能：自动下载对应系统的Python环境包，解压并配置
   * 
   * 步骤：
   * 1. 检测系统类型（Windows/Linux/Mac）
   * 2. 从CDN下载对应系统的Python环境包
   * 3. 解压到指定目录
   * 4. 设置文件执行权限（Linux/Mac）
   * 5. 验证Python环境是否可用
   * 
   * @param {function(string)} onProgress - 进度回调函数
   * @returns {Promise<boolean>} 配置是否成功
   */
  async setupPythonEnv(onProgress) {
    // TODO: 具体实现待定
    // 这里需要确定使用的Python AI框架（LangChain、MemGPT等）
    // 然后根据框架要求下载对应版本的Python环境和依赖
    
    console.log('[环境配置] Python环境配置功能预留，待实现');
    
    // 预留的实现流程：
    try {
      // 1. 确定下载地址
      const downloadUrl = this.getDownloadUrl();
      const targetDir = this.getInstallDir();
      
      // 2. 下载
      onProgress('正在下载Python环境（约50MB）...');
      await this.downloadFile(downloadUrl, targetDir, (progress) => {
        onProgress(`下载进度: ${progress}%`);
      });
      
      // 3. 解压
      onProgress('正在解压...');
      await this.extractArchive(targetDir);
      
      // 4. 设置权限（Linux/Mac）
      onProgress('正在配置权限...');
      await this.setPermissions(targetDir);
      
      // 5. 验证
      onProgress('正在验证...');
      const success = await this.detectPython();
      
      if (success) {
        onProgress('配置完成！');
        return true;
      } else {
        onProgress('验证失败，请手动配置');
        return false;
      }
    } catch (error) {
      console.error('[环境配置] 配置失败:', error);
      onProgress(`配置失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取Python环境下载地址
   * 
   * @returns {string} 下载地址
   */
  getDownloadUrl() {
    // TODO: 根据系统类型和Python版本返回对应的下载地址
    const urls = {
      'win32': 'https://github.com/xxx/liulian-python-env/releases/latest/download/python-windows.zip',
      'linux': 'https://github.com/xxx/liulian-python-env/releases/latest/download/python-linux.tar.gz',
      'darwin': 'https://github.com/xxx/liulian-python-env/releases/latest/download/python-mac.zip'
    };
    
    return urls[this.platform] || '';
  }

  /**
   * 获取Python环境安装目录
   * 
   * @returns {string} 安装目录路径
   */
  getInstallDir() {
    return path.join(process.cwd(), 'node_modules', 'liulian-python-env');
  }

  /**
   * 下载文件
   * 
   * @param {string} url - 下载地址
   * @param {string} targetDir - 目标目录
   * @param {function(number)} onProgress - 进度回调
   */
  async downloadFile(url, targetDir, onProgress) {
    // TODO: 实现文件下载逻辑
    // 使用axios或其他下载库
    console.log('[环境配置] 下载文件功能预留:', url);
  }

  /**
   * 解压压缩包
   * 
   * @param {string} targetDir - 目标目录
   */
  async extractArchive(targetDir) {
    // TODO: 实现解压逻辑
    // 根据文件类型（.zip, .tar.gz）使用对应的解压方法
    console.log('[环境配置] 解压文件功能预留');
  }

  /**
   * 设置文件执行权限
   * 
   * 功能：为Linux/Mac系统设置Python可执行文件的执行权限
   * 
   * @param {string} targetDir - 目标目录
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setPermissions(targetDir) {
    // Windows系统不需要设置权限
    if (this.platform === 'win32') {
      console.log('[环境配置] Windows系统无需设置执行权限');
      return true;
    }

    try {
      const pythonBinPath = path.join(targetDir, 'python', 'bin', 'python');
      const pipPath = path.join(targetDir, 'python', 'bin', 'pip');

      // 设置Python执行权限（rwxr-xr-x）
      if (fs.existsSync(pythonBinPath)) {
        fs.chmodSync(pythonBinPath, '755');
        console.log('[环境配置] 已设置Python执行权限');
      }

      // 设置pip执行权限
      if (fs.existsSync(pipPath)) {
        fs.chmodSync(pipPath, '755');
        console.log('[环境配置] 已设置pip执行权限');
      }

      // 递归设置bin目录下所有文件执行权限
      const binDir = path.join(targetDir, 'python', 'bin');
      if (fs.existsSync(binDir)) {
        const files = fs.readdirSync(binDir);
        files.forEach(file => {
          const filePath = path.join(binDir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            fs.chmodSync(filePath, '755');
          }
        });
        console.log('[环境配置] 已设置bin目录所有文件执行权限');
      }

      return true;
    } catch (error) {
      console.error('[环境配置] 设置权限失败:', error);
      return false;
    }
  }

  /**
   * 获取Python路径
   * 
   * @returns {string|null} Python可执行文件路径
   */
  getPythonPath() {
    return this.pythonPath;
  }

  /**
   * 获取Python版本
   * 
   * @returns {string|null} Python版本号
   */
  getPythonVersion() {
    return this.pythonVersion;
  }
}

/**
 * 临时会话管理
 */
export const sessionManager = {
  /**
   * 创建会话
   * 
   * @param {string} userId - 用户ID
   * @param {string} type - 会话类型
   * @param {object} metadata - 附加元数据
   */
  create(userId, type, metadata = {}) {
    pendingActions.set(userId, {
      type,
      timestamp: Date.now(),
      metadata
    });

    // 设置超时自动清理
    setTimeout(() => {
      this.clear(userId);
    }, SESSION_TIMEOUT);
  },

  /**
   * 检查会话是否存在
   * 
   * @param {string} userId - 用户ID
   * @returns {boolean} 会话是否存在
   */
  has(userId) {
    return pendingActions.has(userId);
  },

  /**
   * 获取会话信息
   * 
   * @param {string} userId - 用户ID
   * @returns {object|null} 会话信息，不存在返回null
   */
  get(userId) {
    return pendingActions.get(userId) || null;
  },

  /**
   * 清除会话
   * 
   * @param {string} userId - 用户ID
   */
  clear(userId) {
    pendingActions.delete(userId);
  },

  /**
   * 清理所有过期会话
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [userId, session] of pendingActions.entries()) {
      if (now - session.timestamp > SESSION_TIMEOUT) {
        pendingActions.delete(userId);
      }
    }
  }
};

// 定期清理过期会话（每5分钟）
setInterval(() => {
  sessionManager.cleanupExpired();
}, 5 * 60 * 1000);

export default EnvironmentDetector;