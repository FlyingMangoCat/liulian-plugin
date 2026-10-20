import fs from 'fs'
import YAML from 'yaml'
import configStore from './config/config.js'

// 模板新增键自动补齐进用户配置：现有配置系统只在用户文件缺失时整体复制，
// 不做补键 —— 这里补上（brain 这类新增段免手动同步）。只填缺失项，
// 绝不动用户已设置的值；补齐需重写文件，用户文件里的注释会丢，键值不受影响
function fillMissing (tpl, user) {
  let changed = false
  for (const k of Object.keys(tpl || {})) {
    const u = user[k]
    if (u === undefined) {
      user[k] = tpl[k]
      changed = true
    } else if (
      tpl[k] && typeof tpl[k] === 'object' && !Array.isArray(tpl[k]) &&
      u && typeof u === 'object' && !Array.isArray(u)
    ) {
      if (fillMissing(tpl[k], u)) changed = true
    }
  }
  return changed
}

// 启动时跑一次（幂等：没缺键就不写文件）
try {
  const tpl = configStore.getdefault_config('liulian', 'ai')
  const userFile = configStore.getFilePath('liulian', 'ai', 'config')
  if (tpl && fs.existsSync(userFile)) {
    const user = YAML.parse(fs.readFileSync(userFile, 'utf8')) || {}
    if (fillMissing(tpl, user)) {
      fs.writeFileSync(userFile, YAML.stringify(user))
      console.log('[aiConfig] 模板新增键已自动补进用户 ai.yaml')
    }
  }
} catch (e) {
  console.error('[aiConfig] 模板补齐失败(不影响运行):', e.message)
}

// AI 配置读取：走插件现有配置系统（模板自动复制用户配置，chokidar 监听热生效）
const aiConfig = {
  get ai() {
    const cfg = configStore.getconfig('liulian', 'ai') || {}
    return cfg.ai || cfg
  }
}

export const config = aiConfig
export default aiConfig
