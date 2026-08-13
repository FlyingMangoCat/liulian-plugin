import config from '#liulian.config';
import LocalProvider from './localProvider.js';
import ApiProvider from './apiProvider.js';

// 接入层统一入口：根据配置选择接入方式，上层只依赖本入口的统一接口
class Provider {
    constructor() {
        const apiCfg = config.ai?.api || {};
        const localCfg = config.ai?.local || {};
        const timeout = config.ai?.performance?.max_response_time || 30000;

        // 配置了通用接口信息时使用通用接口，否则使用本地接入
        this.isApiMode = !!(apiCfg.base_url && apiCfg.api_key);
        this.impl = this.isApiMode
            ? new ApiProvider({ ...apiCfg, timeout })
            : new LocalProvider({ ...localCfg, timeout });
    }

    async generate(model, prompt, options = {}) {
        return this.impl.generate(model, prompt, options);
    }

    async chat(model, messages, options = {}) {
        return this.impl.chat(model, messages, options);
    }

    async generateWithImage(model, prompt, image, options = {}) {
        return this.impl.generateWithImage(model, prompt, image, options);
    }

    async listModels() {
        return this.impl.listModels();
    }

    async pullModel(model) {
        return this.impl.pullModel(model);
    }

    async isModelAvailable(model) {
        return this.impl.isModelAvailable(model);
    }
}

export { Provider, LocalProvider, ApiProvider };
export default new Provider();
