import fs from 'fs'
import YAML from 'yaml'
import chokidar from 'chokidar'
import { logger } from '../../components/index.js'

/** 配置文件管理类 */
class config {
    constructor() {
        /** 默认配置路径 */
        this.defCfgPath = './plugins/liulian-plugin/config/default_config/'
        this.default_config = {}

        /** 用户配置路径 */
        this.configPath = './plugins/liulian-plugin/config/config/'
        this.config = {}

        /** 文件监听器 */
        this.watcher = { config: {}, default_config: {} }

        this.initconfig()
    }

    /** 初始化默认配置 */
    initconfig() {
        /** 检查config/config文件夹是否存在，不存在则创建 */
        if (!fs.existsSync(this.configPath)) {
            fs.mkdirSync(this.configPath)
        }

        /** 读取默认配置模块文件夹 */
        const defCfgfiles = fs.readdirSync(this.defCfgPath)
        for (let defCfgfile of defCfgfiles) {
            if (defCfgfile === 'liulian')
                continue
            let path = `${this.configPath}${defCfgfile}`
            let defaultpath = `${this.defCfgPath}${defCfgfile}`
            /** 检查模块文件夹是否存在，不存在则创建 */
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path)
            }
            /** 读取模块下的yaml配置文件 */
            const files = fs.readdirSync(defaultpath).filter(file => file.endsWith('.yaml'))
            for (let file of files) {
                if (!fs.existsSync(`${this.configPath}${defCfgfile}/${file}`)) {
                    fs.copyFileSync(`${this.defCfgPath}${defCfgfile}/${file}`, `${this.configPath}${defCfgfile}/${file}`)
                }
            }
        }
    }

    /** 
     * 获取配置文件
     * @param app 模块名
     * @param name 配置文件名称
     */
    getconfig(app, name) {
        return this.getYaml(app, name, 'config')
    }

    /** 
    * 获取默认配置文件
    */
    getdefault_config(app, name) {
        return this.getYaml(app, name, 'default_config')
    }

    /** 监听配置文件变化 */
    watch(file, app, name, type = 'default_config') {
        let key = `${app}.${name}`

        if (this.watcher[type][key]) return

        const watcher = chokidar.watch(file)

        watcher.on('change', path => {
            delete this[type][key]
            logger.mark(`[修改留恋插件配置文件][${type}][${app}][${name}]`)
            if (this[`change_${app}${name}`]) {
                this[`change_${app}${name}`]()
            }
        })

        this.watcher[type][key] = watcher
    }

    /** 
     * 获取YAML配置文件
     * @param app 模块名称
     * @param type 默认配置-default_config 留恋插件配置-config
     * @param name 配置文件名（不含后缀）
     */
    getYaml(app, name, type) {
        let file = this.getFilePath(app, name, type)
        let key = `${type}.${name}`

        if (this[type][key]) return this[type][key]

        try {
            this[type][key] = YAML.parse(fs.readFileSync(file, 'utf8'))
        } catch (error) {
            logger.error(`[${app}][${name}] 格式错误 ${error}`)
            return false
        }

        this.watch(file, app, name, type)

        return this[type][key]
    }

    getFilePath(app, name, type) {
        if (type == 'default_config') return `${this.defCfgPath}${app}/${name}.yaml`
        else return `${this.configPath}${app}/${name}.yaml`
    }

    /** 获取当前版本插件信息 */
    async getcurrentplugininfo() {
        let plugininfo = {
            pluginname: await redis.get('Yz:liulian:config:pluginname'),
            version: await redis.get('Yz:liulian:config:version'),
            author: await redis.get('Yz:liulian:config:author'),
            qq: await redis.get('Yz:liulian:config:qq'),
        }
        return plugininfo
    }
}

export default new config()