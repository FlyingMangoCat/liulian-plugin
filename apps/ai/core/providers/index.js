import config from '#liulian.config';
import LocalProvider from './localProvider.js';
import ApiProvider from './apiProvider.js';

// 接入层统一入口：根据配置选择接入方式，上层只依赖本入口的统一接口
// 配置每次现读：impl 按当前配置惰性重建（配置签名变了才重建），ai.yaml 改完下一条消息即生效，
// 不再有"启动时快照"——此前 impl 冻结在导入时刻，改配置不重启不生效（消息发向旧地址）
class Provider {
    constructor() {
        this._impl = null;
        this._sig = '';
        this._isApiMode = false;
    }

    _current() {
        const apiCfg = config.ai?.api || {};
        const localCfg = config.ai?.local || {};
        const timeout = config.ai?.performance?.max_response_time || 30000;
        const sig = JSON.stringify([apiCfg, localCfg, timeout]);
        if (this._sig !== sig) {
            this._isApiMode = !!(apiCfg.base_url && apiCfg.api_key);
            this._impl = this._isApiMode
                ? new ApiProvider({ ...apiCfg, timeout })
                : new LocalProvider({ ...localCfg, timeout });
            this._sig = sig;
        }
        return this._impl;
    }

    get isApiMode() {
        this._current();
        return this._isApiMode;
    }

    async generate(model, prompt, options = {}) {
        return this._current().generate(model, prompt, options);
    }

    async chat(model, messages, options = {}) {
        return this._current().chat(model, messages, options);
    }

    async generateWithImage(model, prompt, image, options = {}) {
        return this._current().generateWithImage(model, prompt, image, options);
    }

    async listModels() {
        return this._current().listModels();
    }

    async pullModel(model) {
        return this._current().pullModel(model);
    }

    async isModelAvailable(model) {
        return this._current().isModelAvailable(model);
    }
}

export { Provider, LocalProvider, ApiProvider };
export default new Provider();
