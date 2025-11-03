# 榴莲插件 (liulian-plugin) - iFlow 上下文说明

## 项目概览

*   **名称**: 榴莲插件 (liulian-plugin)
*   **类型**: 云崽 (Yunzai-Bot) 插件
*   **描述**: 一个多功能扩展插件，提供原神地下地图、B站推送、插件管理、AI对话、群聊互动（如娶群友、随机表情、运势、话痨统计、天气、广播、群聊闭嘴）等功能。
*   **技术栈**:
    *   JavaScript (Node.js)
    *   ESM (ECMAScript Modules)
    *   依赖: `image-size`, `axios`, `ffmpeg`, `request`, `qrcode`, `ioredis`, `pg`, `cheerio` 等。
    *   内部模块导入: 使用 `#liulian` 和 `#liulian.models` 别名。

## 核心功能模块 (apps)

插件的功能主要分布在 `apps` 目录下的多个 `.js` 文件中，通过 `apps/index.js` 进行统一导出和规则注册。

*   **帮助与信息**: `help.js`, `maphelp.js`, `pluginhelp.js`, `修仙help.js`, `bilibilihelp.js` 提供各类帮助信息和版本介绍。
*   **AI 对话**: `ai.js` 实现了基于 Ollama 的 AI 对话功能，支持多模型、记忆、中间件模式等。
*   **原神/星铁相关**:
    *   地下地图: `XMmap.js` 提供须弥雨林和沙漠等区域的地下地图查看。
    *   猜角色/头像: `Guess.js` 实现猜原神、星铁、邦布角色或头像的游戏。
*   **群聊互动**:
    *   娱乐: `whoismywife.js` (娶群友), `Cat.js` (猫猫游戏), `manyfunctions.js` (毒鸡汤、彩虹屁、土味情话、笑话、天气、早报、运势、神之眼、看头像、舔狗日记、色图/老婆、每日句子/单词), `Random expression.js` (随机表情), `chatterboxStat.js` (话痨统计), `other.js` (二次元的我、我的成分、答案之书、观音灵签), `classic.js` (经典语录/怪话)。
    *   管理: `Groupshutup.js` (群聊闭嘴/张嘴), `transmit.js` (带话/广播), `伪造信息.js` (伪造消息), `打卡.js`, `群友强制休息.js`, `updatecard.js` (更新群名片)。
*   **B站推送**: `bilibiliPush.js` 实现了 B 站动态推送功能。
*   **插件管理**: `pluginManager.js` (v2), `V3pluginManager.js` (v3) 提供插件的加载、卸载、列表查看等管理功能。
*   **其他**: `寄你太美.js` (图片/动图回复), `admin.js` (设置、更新、配置), `status.js` (插件状态查看)。

## 配置与数据

*   **配置**: `model/config/` 目录下存放配置文件。
*   **数据**: `components/Data.js` 用于数据处理。使用 Redis (`ioredis`) 存储插件信息等。
*   **资源**: `resources/` 目录包含图片、表情包、渲染模板等静态资源。

## 构建与运行

1.  **安装**:
    *   将插件放置于 Yunzai-Bot 的 `plugins` 目录下。
    *   在插件目录下执行 `pnpm install -P` 安装依赖。
2.  **运行**:
    *   作为 Yunzai-Bot 插件，随 Yunzai-Bot 启动而加载。
    *   **AI 中间件模式**: 可在插件目录下执行 `node liulian.js` 启动独立的 AI 服务。
3.  **更新**:
    *   使用 `git pull` 更新代码。
    *   执行 `pnpm install -P` 更新依赖（如有新增）。
    *   使用插件内命令 `#榴莲更新` 或 `#榴莲更新图像` 进行更新。
    *   **每次更新后自动推送到Gitee仓库**

## 开发约定

*   **模块化**: 功能分散在 `apps/` 目录下的独立文件中。
*   **规则注册**: 所有命令规则在 `apps/index.js` 中的 `rule` 对象中定义，包括正则表达式、优先级和描述。
*   **ESM**: 项目使用 ES Module (`"type": "module"` in `package.json`)。
*   **内部导入**: 使用 `#liulian` 和 `#liulian.models` 别名简化内部模块路径。
*   **文件管理**: 临时说明文件（如AI_MIDDLEWARE_INTEGRATION.txt）不应推送到仓库