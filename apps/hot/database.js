import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data', 'hot');

class HotDatabase {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        try {
            // 确保数据目录存在
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }

            // 初始化各个JSON文件
            this.ensureJsonFile('global_blocked_keywords.json', []);
            this.ensureJsonFile('group_blocked_keywords.json', []);
            this.ensureJsonFile('subscriptions.json', []);
            this.ensureJsonFile('applications.json', []);
            this.ensureJsonFile('history.json', []);
            this.ensureJsonFile('keywords.json', []);

            this.isConnected = true;
            console.log('[HotDatabase] 文件存储初始化成功');
        } catch (error) {
            console.error('[HotDatabase] 初始化失败:', error);
        }
    }

    ensureJsonFile(filename, defaultData) {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        }
    }

    readJsonFile(filename) {
        try {
            const filePath = path.join(DATA_DIR, filename);
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`[HotDatabase] 读取文件失败 ${filename}:`, error);
            return [];
        }
    }

    writeJsonFile(filename, data) {
        try {
            const filePath = path.join(DATA_DIR, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error(`[HotDatabase] 写入文件失败 ${filename}:`, error);
            return false;
        }
    }

    // 全局屏蔽词管理
    async addGlobalBlockedKeyword(keyword, createdBy) {
        try {
            const keywords = this.readJsonFile('global_blocked_keywords.json');
            if (keywords.includes(keyword)) {
                return false;
            }
            keywords.push(keyword);
            this.writeJsonFile('global_blocked_keywords.json', keywords);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 添加全局屏蔽词失败:', error);
            return false;
        }
    }

    async removeGlobalBlockedKeyword(keyword) {
        try {
            const keywords = this.readJsonFile('global_blocked_keywords.json');
            const filtered = keywords.filter(k => k !== keyword);
            this.writeJsonFile('global_blocked_keywords.json', filtered);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 删除全局屏蔽词失败:', error);
            return false;
        }
    }

    async getGlobalBlockedKeywords() {
        try {
            return this.readJsonFile('global_blocked_keywords.json');
        } catch (error) {
            console.error('[HotDatabase] 获取全局屏蔽词失败:', error);
            return [];
        }
    }

    // 群屏蔽词管理
    async addGroupBlockedKeyword(groupId, keyword, createdBy) {
        try {
            const data = this.readJsonFile('group_blocked_keywords.json');
            const groupData = data.find(g => g.group_id === groupId) || { group_id: groupId, keywords: [] };
            
            if (groupData.keywords.includes(keyword)) {
                return false;
            }

            groupData.keywords.push(keyword);
            
            // 移除旧的群数据
            const filtered = data.filter(g => g.group_id !== groupId);
            filtered.push(groupData);
            
            this.writeJsonFile('group_blocked_keywords.json', filtered);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 添加群屏蔽词失败:', error);
            return false;
        }
    }

    async removeGroupBlockedKeyword(groupId, keyword) {
        try {
            const data = this.readJsonFile('group_blocked_keywords.json');
            const groupData = data.find(g => g.group_id === groupId);
            
            if (!groupData) {
                return true;
            }

            groupData.keywords = groupData.keywords.filter(k => k !== keyword);
            
            this.writeJsonFile('group_blocked_keywords.json', data);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 删除群屏蔽词失败:', error);
            return false;
        }
    }

    async getGroupBlockedKeywords(groupId) {
        try {
            const data = this.readJsonFile('group_blocked_keywords.json');
            const groupData = data.find(g => g.group_id === groupId);
            return groupData ? groupData.keywords : [];
        } catch (error) {
            console.error('[HotDatabase] 获取群屏蔽词失败:', error);
            return [];
        }
    }

    // 检查是否被屏蔽
    async isBlocked(title, groupId) {
        try {
            // 检查全局屏蔽词
            const globalKeywords = this.readJsonFile('global_blocked_keywords.json');
            for (const keyword of globalKeywords) {
                if (title.includes(keyword)) {
                    return { blocked: true, reason: '全局屏蔽词', keyword };
                }
            }

            // 检查群屏蔽词
            const groupKeywords = await this.getGroupBlockedKeywords(groupId);
            for (const keyword of groupKeywords) {
                if (title.includes(keyword)) {
                    return { blocked: true, reason: '群屏蔽词', keyword };
                }
            }

            return { blocked: false };
        } catch (error) {
            console.error('[HotDatabase] 检查屏蔽词失败:', error);
            return { blocked: false };
        }
    }

    // 订阅管理
    async addSubscription(groupId, keyword, platform) {
        try {
            const data = this.readJsonFile('subscriptions.json');
            
            // 检查是否已订阅
            const existing = data.find(s => s.group_id === groupId && s.keyword === keyword);
            if (existing) {
                return { success: false, message: '已订阅该关键词' };
            }

            // 检查订阅上限
            const count = data.filter(s => s.group_id === groupId).length;
            const limit = 10; // 默认10个
            
            if (count >= limit) {
                return { success: false, message: `订阅已达上限(${limit}个)` };
            }

            data.push({
                group_id: groupId,
                keyword: keyword,
                platform: platform || 'douyin',
                status: 'active',
                created_at: new Date().toISOString()
            });

            this.writeJsonFile('subscriptions.json', data);
            return { success: true, message: '订阅成功' };
        } catch (error) {
            console.error('[HotDatabase] 添加订阅失败:', error);
            return { success: false, message: '订阅失败' };
        }
    }

    async removeSubscription(groupId, keyword) {
        try {
            const data = this.readJsonFile('subscriptions.json');
            const filtered = data.filter(s => !(s.group_id === groupId && s.keyword === keyword));
            this.writeJsonFile('subscriptions.json', filtered);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 删除订阅失败:', error);
            return false;
        }
    }

    async getGroupSubscriptions(groupId) {
        try {
            const data = this.readJsonFile('subscriptions.json');
            return data.filter(s => s.group_id === groupId);
        } catch (error) {
            console.error('[HotDatabase] 获取群订阅失败:', error);
            return [];
        }
    }

    async getAllSubscriptions() {
        try {
            return this.readJsonFile('subscriptions.json');
        } catch (error) {
            console.error('[HotDatabase] 获取所有订阅失败:', error);
            return [];
        }
    }

    // 申请管理
    async addApplication(groupId, keyword) {
        try {
            const data = this.readJsonFile('applications.json');
            
            const existing = data.find(a => a.group_id === groupId && a.keyword === keyword);
            if (existing) {
                existing.application_count++;
            } else {
                data.push({
                    id: Date.now(),
                    group_id: groupId,
                    keyword: keyword,
                    application_count: 1,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });
            }

            this.writeJsonFile('applications.json', data);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 添加申请失败:', error);
            return false;
        }
    }

    async getApplications() {
        try {
            const data = this.readJsonFile('applications.json');
            return data
                .filter(a => a.status === 'pending')
                .sort((a, b) => b.application_count - a.application_count);
        } catch (error) {
            console.error('[HotDatabase] 获取申请列表失败:', error);
            return [];
        }
    }

    async approveApplication(groupId, keyword) {
        try {
            const applications = this.readJsonFile('applications.json');
            const subscriptions = this.readJsonFile('subscriptions.json');

            // 添加订阅
            subscriptions.push({
                group_id: groupId,
                keyword: keyword,
                platform: 'douyin',
                status: 'active',
                created_at: new Date().toISOString()
            });

            // 更新申请状态
            const application = applications.find(a => a.group_id === groupId && a.keyword === keyword);
            if (application) {
                application.status = 'approved';
            }

            this.writeJsonFile('applications.json', applications);
            this.writeJsonFile('subscriptions.json', subscriptions);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 批准申请失败:', error);
            return false;
        }
    }

    async rejectApplication(groupId, keyword) {
        try {
            const data = this.readJsonFile('applications.json');
            const application = data.find(a => a.group_id === groupId && a.keyword === keyword);
            if (application) {
                application.status = 'rejected';
            }
            this.writeJsonFile('applications.json', data);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 拒绝申请失败:', error);
            return false;
        }
    }

    // 历史数据管理
    async saveHotSearchHistory(platform, title, hotValue) {
        try {
            const data = this.readJsonFile('history.json');
            
            // 添加新的历史记录
            data.push({
                platform: platform,
                title: title,
                hot_value: hotValue,
                record_time: new Date().toISOString()
            });

            // 限制历史记录数量（最多保留10000条）
            if (data.length > 10000) {
                data.splice(0, data.length - 10000);
            }

            this.writeJsonFile('history.json', data);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 保存热搜历史失败:', error);
            return false;
        }
    }

    async getHotSearchHistory(platform, days = 7) {
        try {
            const data = this.readJsonFile('history.json');
            const cutoffTime = new Date();
            cutoffTime.setDate(cutoffTime.getDate() - days);

            return data
                .filter(item => {
                    const itemTime = new Date(item.record_time);
                    return item.platform === platform && itemTime >= cutoffTime;
                })
                .sort((a, b) => new Date(b.record_time) - new Date(a.record_time) || (b.hot_value || 0) - (a.hot_value || 0));
        } catch (error) {
            console.error('[HotDatabase] 获取热搜历史失败:', error);
            return [];
        }
    }

    async getTopKeywords(days = 7, limit = 50) {
        try {
            const data = this.readJsonFile('keywords.json');
            const cutoffTime = new Date();
            cutoffTime.setDate(cutoffTime.getDate() - days);

            const keywordCount = {};
            
            data.forEach(item => {
                const itemTime = new Date(item.record_time);
                if (itemTime >= cutoffTime) {
                    const word = item.word;
                    keywordCount[word] = (keywordCount[word] || 0) + 1;
                }
            });

            return Object.entries(keywordCount)
                .map(([text, count]) => ({ text, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('[HotDatabase] 获取热门关键词失败:', error);
            return [];
        }
    }

    // 保存分词后的关键词
    async saveKeyword(platform, word) {
        try {
            const data = this.readJsonFile('keywords.json');
            
            data.push({
                platform: platform,
                word: word,
                record_time: new Date().toISOString()
            });

            // 限制关键词记录数量（最多保留50000条）
            if (data.length > 50000) {
                data.splice(0, data.length - 50000);
            }

            this.writeJsonFile('keywords.json', data);
            return true;
        } catch (error) {
            console.error('[HotDatabase] 保存关键词失败:', error);
            return false;
        }
    }

    // 清理过期数据
    async cleanupOldHistory() {
        try {
            const data = this.readJsonFile('history.json');
            const retentionDays = 30;
            const cutoffTime = new Date();
            cutoffTime.setDate(cutoffTime.getDate() - retentionDays);

            // 清理过期的历史记录
            const filtered = data.filter(item => {
                const itemTime = new Date(item.record_time);
                return itemTime >= cutoffTime;
            });

            this.writeJsonFile('history.json', filtered);

            // 清理过期的关键词
            const keywords = this.readJsonFile('keywords.json');
            const filteredKeywords = keywords.filter(item => {
                const itemTime = new Date(item.record_time);
                return itemTime >= cutoffTime;
            });

            this.writeJsonFile('keywords.json', filteredKeywords);

            // 清理过期的申请
            const applications = this.readJsonFile('applications.json');
            const applicationCutoffTime = new Date();
            applicationCutoffTime.setDate(applicationCutoffTime.getDate() - 7);

            const filteredApplications = applications.filter(item => {
                const itemTime = new Date(item.created_at);
                return item.status !== 'pending' || itemTime >= applicationCutoffTime;
            });

            this.writeJsonFile('applications.json', filteredApplications);

            console.log('[HotDatabase] 清理过期数据完成');
        } catch (error) {
            console.error('[HotDatabase] 清理过期数据失败:', error);
        }
    }

    async disconnect() {
        this.isConnected = false;
    }
}

export default new HotDatabase();