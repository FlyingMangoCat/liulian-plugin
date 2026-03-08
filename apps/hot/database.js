import pg from 'pg';
const { Pool } = pg;
import config from '#liulian.config';

class HotDatabase {
    constructor() {
        this.pgPool = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            // 连接PostgreSQL
            this.pgPool = new Pool(config.ai.database.postgres);
            await this.pgPool.query('SELECT 1');
            console.log('[HotDatabase] PostgreSQL连接成功');
            this.isConnected = true;
            await this.initTables();
        } catch (error) {
            console.error('[HotDatabase] 连接失败:', error);
        }
    }

    async initTables() {
        // 全局屏蔽词表
        const globalBlockedKeywordsQuery = `
            CREATE TABLE IF NOT EXISTS hot_global_blocked_keywords (
                id SERIAL PRIMARY KEY,
                keyword VARCHAR(100) NOT NULL UNIQUE,
                created_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_hot_global_blocked_keywords ON hot_global_blocked_keywords(keyword);
        `;
        await this.pgPool.query(globalBlockedKeywordsQuery);

        // 群屏蔽词表
        const groupBlockedKeywordsQuery = `
            CREATE TABLE IF NOT EXISTS hot_group_blocked_keywords (
                id SERIAL PRIMARY KEY,
                group_id VARCHAR(50) NOT NULL,
                keyword VARCHAR(100) NOT NULL,
                created_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, keyword)
            );
            CREATE INDEX IF NOT EXISTS idx_hot_group_blocked_keywords ON hot_group_blocked_keywords(group_id);
        `;
        await this.pgPool.query(groupBlockedKeywordsQuery);

        // 订阅表
        const subscriptionsQuery = `
            CREATE TABLE IF NOT EXISTS hot_subscriptions (
                id SERIAL PRIMARY KEY,
                group_id VARCHAR(50) NOT NULL,
                keyword VARCHAR(100) NOT NULL,
                platform VARCHAR(20) DEFAULT 'douyin',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, keyword)
            );
            CREATE INDEX IF NOT EXISTS idx_hot_subscriptions ON hot_subscriptions(group_id);
            CREATE INDEX IF NOT EXISTS idx_hot_subscriptions_keyword ON hot_subscriptions(keyword);
        `;
        await this.pgPool.query(subscriptionsQuery);

        // 申请表
        const applicationsQuery = `
            CREATE TABLE IF NOT EXISTS hot_subscription_applications (
                id SERIAL PRIMARY KEY,
                group_id VARCHAR(50) NOT NULL,
                keyword VARCHAR(100) NOT NULL,
                application_count INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, keyword)
            );
            CREATE INDEX IF NOT EXISTS idx_hot_applications ON hot_subscription_applications(group_id);
        `;
        await this.pgPool.query(applicationsQuery);

        // 热搜历史表
        const historyQuery = `
            CREATE TABLE IF NOT EXISTS hot_search_history (
                id SERIAL PRIMARY KEY,
                platform VARCHAR(20) NOT NULL,
                title VARCHAR(200) NOT NULL,
                hot_value INTEGER,
                record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_hot_history_platform ON hot_search_history(platform);
            CREATE INDEX IF NOT EXISTS idx_hot_history_time ON hot_search_history(record_time);
        `;
        await this.pgPool.query(historyQuery);

        console.log('[HotDatabase] 热搜表初始化完成');
    }

    // 全局屏蔽词管理
    async addGlobalBlockedKeyword(keyword, createdBy) {
        try {
            await this.pgPool.query(
                'INSERT INTO hot_global_blocked_keywords (keyword, created_by) VALUES ($1, $2)',
                [keyword, createdBy]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 添加全局屏蔽词失败:', error);
            return false;
        }
    }

    async removeGlobalBlockedKeyword(keyword) {
        try {
            await this.pgPool.query(
                'DELETE FROM hot_global_blocked_keywords WHERE keyword = $1',
                [keyword]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 删除全局屏蔽词失败:', error);
            return false;
        }
    }

    async getGlobalBlockedKeywords() {
        try {
            const result = await this.pgPool.query('SELECT keyword FROM hot_global_blocked_keywords ORDER BY keyword');
            return result.rows.map(row => row.keyword);
        } catch (error) {
            console.error('[HotDatabase] 获取全局屏蔽词失败:', error);
            return [];
        }
    }

    // 群屏蔽词管理
    async addGroupBlockedKeyword(groupId, keyword, createdBy) {
        try {
            await this.pgPool.query(
                'INSERT INTO hot_group_blocked_keywords (group_id, keyword, created_by) VALUES ($1, $2, $3)',
                [groupId, keyword, createdBy]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 添加群屏蔽词失败:', error);
            return false;
        }
    }

    async removeGroupBlockedKeyword(groupId, keyword) {
        try {
            await this.pgPool.query(
                'DELETE FROM hot_group_blocked_keywords WHERE group_id = $1 AND keyword = $2',
                [groupId, keyword]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 删除群屏蔽词失败:', error);
            return false;
        }
    }

    async getGroupBlockedKeywords(groupId) {
        try {
            const result = await this.pgPool.query(
                'SELECT keyword FROM hot_group_blocked_keywords WHERE group_id = $1 ORDER BY keyword',
                [groupId]
            );
            return result.rows.map(row => row.keyword);
        } catch (error) {
            console.error('[HotDatabase] 获取群屏蔽词失败:', error);
            return [];
        }
    }

    // 检查是否被屏蔽
    async isBlocked(title, groupId) {
        try {
            // 检查全局屏蔽词
            const globalResult = await this.pgPool.query(
                'SELECT keyword FROM hot_global_blocked_keywords WHERE $1 LIKE \'%\' || keyword || \'%\'',
                [title]
            );
            if (globalResult.rows.length > 0) {
                return { blocked: true, reason: '全局屏蔽词', keyword: globalResult.rows[0].keyword };
            }

            // 检查群屏蔽词
            const groupResult = await this.pgPool.query(
                'SELECT keyword FROM hot_group_blocked_keywords WHERE group_id = $1 AND $2 LIKE \'%\' || keyword || \'%\'',
                [groupId, title]
            );
            if (groupResult.rows.length > 0) {
                return { blocked: true, reason: '群屏蔽词', keyword: groupResult.rows[0].keyword };
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
            // 检查是否已订阅
            const existing = await this.pgPool.query(
                'SELECT * FROM hot_subscriptions WHERE group_id = $1 AND keyword = $2',
                [groupId, keyword]
            );
            
            if (existing.rows.length > 0) {
                return { success: false, message: '已订阅该关键词' };
            }

            // 检查订阅上限
            const countResult = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM hot_subscriptions WHERE group_id = $1',
                [groupId]
            );
            const count = parseInt(countResult.rows[0].count);
            
            // 从配置文件读取上限
            const hotConfig = config.getdefault_config('liulian', 'hot', 'config');
            const limit = hotConfig.push.subscription_limit || 10;
            
            if (count >= limit) {
                return { success: false, message: `订阅已达上限(${limit}个)` };
            }

            await this.pgPool.query(
                'INSERT INTO hot_subscriptions (group_id, keyword, platform) VALUES ($1, $2, $3)',
                [groupId, keyword, platform]
            );
            return { success: true, message: '订阅成功' };
        } catch (error) {
            console.error('[HotDatabase] 添加订阅失败:', error);
            return { success: false, message: '订阅失败' };
        }
    }

    async removeSubscription(groupId, keyword) {
        try {
            await this.pgPool.query(
                'DELETE FROM hot_subscriptions WHERE group_id = $1 AND keyword = $2',
                [groupId, keyword]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 删除订阅失败:', error);
            return false;
        }
    }

    async getGroupSubscriptions(groupId) {
        try {
            const result = await this.pgPool.query(
                'SELECT keyword, platform, status FROM hot_subscriptions WHERE group_id = $1 ORDER BY keyword',
                [groupId]
            );
            return result.rows;
        } catch (error) {
            console.error('[HotDatabase] 获取群订阅失败:', error);
            return [];
        }
    }

    async getAllSubscriptions() {
        try {
            const result = await this.pgPool.query(
                'SELECT group_id, keyword, platform, status FROM hot_subscriptions ORDER BY group_id, keyword'
            );
            return result.rows;
        } catch (error) {
            console.error('[HotDatabase] 获取所有订阅失败:', error);
            return [];
        }
    }

    // 申请管理
    async addApplication(groupId, keyword) {
        try {
            const existing = await this.pgPool.query(
                'SELECT * FROM hot_subscription_applications WHERE group_id = $1 AND keyword = $2',
                [groupId, keyword]
            );
            
            if (existing.rows.length > 0) {
                // 增加申请次数
                await this.pgPool.query(
                    'UPDATE hot_subscription_applications SET application_count = application_count + 1 WHERE group_id = $1 AND keyword = $2',
                    [groupId, keyword]
                );
            } else {
                await this.pgPool.query(
                    'INSERT INTO hot_subscription_applications (group_id, keyword) VALUES ($1, $2)',
                    [groupId, keyword]
                );
            }
            return true;
        } catch (error) {
            console.error('[HotDatabase] 添加申请失败:', error);
            return false;
        }
    }

    async getApplications() {
        try {
            const result = await this.pgPool.query(
                'SELECT * FROM hot_subscription_applications WHERE status = \'pending\' ORDER BY application_count DESC, created_at'
            );
            return result.rows;
        } catch (error) {
            console.error('[HotDatabase] 获取申请列表失败:', error);
            return [];
        }
    }

    async approveApplication(groupId, keyword) {
        try {
            await this.pgPool.query('BEGIN');
            
            // 添加订阅
            await this.pgPool.query(
                'INSERT INTO hot_subscriptions (group_id, keyword) VALUES ($1, $2)',
                [groupId, keyword]
            );
            
            // 更新申请状态
            await this.pgPool.query(
                'UPDATE hot_subscription_applications SET status = \'approved\' WHERE group_id = $1 AND keyword = $2',
                [groupId, keyword]
            );
            
            await this.pgPool.query('COMMIT');
            return true;
        } catch (error) {
            await this.pgPool.query('ROLLBACK');
            console.error('[HotDatabase] 批准申请失败:', error);
            return false;
        }
    }

    async rejectApplication(groupId, keyword) {
        try {
            await this.pgPool.query(
                'UPDATE hot_subscription_applications SET status = \'rejected\' WHERE group_id = $1 AND keyword = $2',
                [groupId, keyword]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 拒绝申请失败:', error);
            return false;
        }
    }

    // 历史数据管理
    async saveHotSearchHistory(platform, title, hotValue) {
        try {
            await this.pgPool.query(
                'INSERT INTO hot_search_history (platform, title, hot_value) VALUES ($1, $2, $3)',
                [platform, title, hotValue]
            );
            return true;
        } catch (error) {
            console.error('[HotDatabase] 保存热搜历史失败:', error);
            return false;
        }
    }

    async getHotSearchHistory(platform, days = 7) {
        try {
            const result = await this.pgPool.query(
                `SELECT title, hot_value, record_time 
                 FROM hot_search_history 
                 WHERE platform = $1 
                 AND record_time >= NOW() - INTERVAL '${days} days'
                 ORDER BY record_time DESC, hot_value DESC`,
                [platform]
            );
            return result.rows;
        } catch (error) {
            console.error('[HotDatabase] 获取热搜历史失败:', error);
            return [];
        }
    }

    async getTopKeywords(days = 7, limit = 50) {
        try {
            const result = await this.pgPool.query(
                `SELECT title, COUNT(*) as count 
                 FROM hot_search_history 
                 WHERE record_time >= NOW() - INTERVAL '${days} days'
                 GROUP BY title 
                 ORDER BY count DESC 
                 LIMIT $1`,
                [limit]
            );
            return result.rows;
        } catch (error) {
            console.error('[HotDatabase] 获取热门关键词失败:', error);
            return [];
        }
    }

    // 清理过期数据
    async cleanupOldHistory() {
        try {
            const hotConfig = config.getdefault_config('liulian', 'hot', 'config');
            const retentionDays = hotConfig.history_retention_days || 30;
            
            await this.pgPool.query(
                `DELETE FROM hot_search_history WHERE record_time < NOW() - INTERVAL '${retentionDays} days'`
            );
            
            // 清理过期的申请
            await this.pgPool.query(
                `DELETE FROM hot_subscription_applications 
                 WHERE status = 'pending' 
                 AND created_at < NOW() - INTERVAL '7 days'`
            );
            
            console.log('[HotDatabase] 清理过期数据完成');
        } catch (error) {
            console.error('[HotDatabase] 清理过期数据失败:', error);
        }
    }

    async disconnect() {
        if (this.pgPool) {
            await this.pgPool.end();
        }
        this.isConnected = false;
    }
}

export default new HotDatabase();