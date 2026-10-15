import axios from 'axios';
import config from '#liulian.config';

/**
 * 记忆服务接口（插件端唯一入口）
 *
 * 记忆/好感度的存储与计算逻辑在自建后端服务（独立仓库）中实现，
 * 插件端只保留本接口，按配置模式调用：
 * - mode: off    无记忆（默认，无状态对话）
 * - mode: cloud  调用自建云端记忆服务
 *
 * 接口约定（后端服务需实现，鉴权头 Authorization: Bearer <api_key>）：
 *   GET    /memory?userId=<id>     → { memories: ["...", ...] }
 *   POST   /memory  { userId, text, type }   → { ok: true }
 *   DELETE /memory?userId=<id>     → { ok: true }
 *   GET    /resonance?userId=<id>  → { value: <int>, level: "NEUTRAL|COLD|FRIENDLY|INTIMATE|HATED" }
 *   POST   /resonance { userId, change }     → { ok: true }
 *
 * 所有方法失败时静默降级（返回空值/false），不影响对话主流程
 */
class MemoryService {
    constructor() {
        const memCfg = config.ai?.memory || {};
        this.mode = memCfg.mode || 'off';
        const cloud = memCfg.cloud || {};
        this.baseUrl = (cloud.base_url || '').replace(/\/+$/, '');
        this.apiKey = cloud.api_key || '';
        this.timeout = cloud.timeout || 5000;
    }

    // 记忆服务是否可用（cloud 模式且配置完整）
    isEnabled() {
        return this.mode === 'cloud' && !!(this.baseUrl && this.apiKey);
    }

    async request(method, path, params = null, body = null) {
        const response = await axios({
            method,
            url: `${this.baseUrl}${path}`,
            params,
            data: body,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: this.timeout
        });
        return response.data;
    }

    // 获取用户最近记忆（最多 limit 条）
    async getMemories(userId, limit = 5) {
        if (!this.isEnabled()) return [];
        try {
            const data = await this.request('get', '/memory', { userId });
            return Array.isArray(data?.memories) ? data.memories.slice(0, limit) : [];
        } catch (error) {
            console.log('[MemoryService] 获取记忆失败:', error.message);
            return [];
        }
    }

    // 保存一条用户记忆
    async saveMemory(userId, memoryText, memoryType = 'interaction') {
        if (!this.isEnabled()) return false;
        try {
            await this.request('post', '/memory', null, { userId, text: memoryText, type: memoryType });
            return true;
        } catch (error) {
            console.log('[MemoryService] 保存记忆失败:', error.message);
            return false;
        }
    }

    // 重置用户全部记忆
    async resetUserMemories(userId) {
        if (!this.isEnabled()) return false;
        try {
            await this.request('delete', '/memory', { userId });
            return true;
        } catch (error) {
            console.log('[MemoryService] 重置记忆失败:', error.message);
            return false;
        }
    }

    // 获取用户好感度 { value, level }，无记录返回 null
    async getUserResonance(userId) {
        if (!this.isEnabled()) return null;
        try {
            const data = await this.request('get', '/resonance', { userId });
            if (data && typeof data.value === 'number') {
                return { value: data.value, level: data.level || 'NEUTRAL' };
            }
            return null;
        } catch (error) {
            console.log('[MemoryService] 获取好感度失败:', error.message);
            return null;
        }
    }

    // 更新用户好感度（change 为增减量）
    async updateUserResonance(userId, change) {
        if (!this.isEnabled()) return false;
        try {
            await this.request('post', '/resonance', null, { userId, change });
            return true;
        } catch (error) {
            console.log('[MemoryService] 更新好感度失败:', error.message);
            return false;
        }
    }

    // 状态查询（供 #榴莲状态 / 中间件状态接口使用）
    getStatus() {
        return {
            mode: this.mode,
            available: this.isEnabled()
        };
    }
}

export default new MemoryService();
