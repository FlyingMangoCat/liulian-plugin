import configStore from './config/config.js'

// AI 配置读取：走插件现有配置系统（模板自动复制用户配置，chokidar 监听热生效）
const aiConfig = {
  get ai() {
    const cfg = configStore.getconfig('liulian', 'ai') || {}
    return cfg.ai || cfg
  }
}

export const config = aiConfig
export default aiConfig
