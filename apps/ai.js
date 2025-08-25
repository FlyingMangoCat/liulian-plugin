// plugins/liulian-plugin/apps/ai.js
import lodash from 'lodash';
import aiconfig from '../config/aiconfig.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.join(__dirname, 'ai/plugins');

// 动态加载的插件列表
let loadedPlugins = [];

// 动态加载所有插件
async function loadPlugins() {
  try {
    const files = await fs.readdir(pluginsDir);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    for (const file of jsFiles) {
      try {
        const filePath = path.join(pluginsDir, file);
        const pluginModule = await import(`file://${filePath}`);

        // 检查插件格式是否正确（是否有execute方法和info属性）
        if (pluginModule.default && typeof pluginModule.default.execute === 'function') {
          loadedPlugins.push(pluginModule.default);
          console.log(`[榴莲AI] 插件加载成功: ${pluginModule.default.constructor.info?.name || file}`);
        } else {
          console.warn(`[榴莲AI] 插件格式不正确，已跳过: ${file}`);
        }
      } catch (loadError) {
        console.error(`[榴莲AI] 加载插件 ${file} 时出错:`, loadError);
      }
    }

    // 按优先级从高到低排序
    loadedPlugins.sort((a, b) => (a.constructor.info?.priority || 100) - (b.constructor.info?.priority || 100));

  } catch (error) {
    console.error('[榴莲AI] 读取插件目录失败:', error);
  }
}

// 初始化时加载插件
await loadPlugins();

// 云崽规则定义
export const rule = {
  ai: {
    reg: '^.*$', // 正则匹配所有消息
    priority: 1000,
    describe: 'AI自动回复',
  },
};

// 主处理函数
export async function ai(e) {
  // 1. 前置检查：忽略自身消息和命令消息（例如已由其他插件处理的@消息）
  if (e.user_id === e.self_id) return;

  // 2. 概率触发
  const probability = e.isPrivate ? aiconfig.probability.private : aiconfig.probability.group;
  if (lodash.random(1, 100) > probability) return;

  // 3. 遍历所有插件，直到有一个能成功处理
  for (const plugin of loadedPlugins) {
    // 检查插件是否匹配当前消息（如果插件有match方法）
    if (typeof plugin.constructor.info?.match === 'function' && !plugin.constructor.info.match(e)) {
      continue;
    }

    try {
      const reply = await plugin.execute(e);
      if (reply) {
        await e.reply(reply, true);
        return; // 成功回复后立即退出
      }
    } catch (error) {
      // 某个插件执行出错，记录错误并继续尝试下一个插件
      console.error(`[榴莲AI] 插件 ${plugin.constructor.info?.name} 执行错误:`, error);
    }
  }

  // 4. 所有插件都无法处理，可以不做任何反应，或者记录日志
  // console.log('[榴莲AI] 没有插件能处理此消息');
}