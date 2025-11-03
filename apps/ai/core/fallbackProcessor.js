/**
 * 降级处理器 - 处理AI服务不可用时的备用策略
 * 
 * 该模块提供：
 * 1. AI服务不可用时的备用回复
 * 2. 基于关键词的简单回复
 * 3. 系统维护提醒
 * 4. 服务恢复通知
 */

class FallbackProcessor {
    constructor() {
        // 关键词回复映射
        this.keywordReplies = {
            '你好': [
                '你好呀！',
                '你好！有什么可以帮助你的吗？',
                '嗨！很高兴见到你~'
            ],
            '谢谢': [
                '不客气！',
                '不用谢，这是我应该做的',
                '很乐意帮助你！'
            ],
            '再见': [
                '再见！',
                '拜拜，下次见~',
                '下次再聊哦！'
            ],
            '帮助': [
                '需要帮助吗？',
                '我可以帮你解答问题',
                '有什么不懂的可以问我'
            ],
            '问题': [
                '你有什么问题？',
                '请告诉我你的问题',
                '我会尽力回答你的问题'
            ],
            '天气': [
                '你可以通过其他方式查询天气哦',
                '天气信息请查询专业天气应用',
                '建议查看天气预报应用'
            ]
        };
        
        // 随机回复池
        this.randomReplies = [
            '让我想想...',
            '稍等一下',
            '这个问题很有意思',
            '我需要更多时间思考',
            '让我考虑一下',
            '这需要仔细想想',
            '好问题！',
            '让我研究一下',
            '这个问题值得思考',
            '我会尽力回答'
        ];
    }

    /**
     * 处理消息并返回降级回复
     * 
     * 当AI服务不可用时，根据消息内容提供合适的降级回复
     * 优先检查关键词匹配，如果没有匹配则返回随机回复
     * 
     * @param {string} message - 用户消息
     * @returns {string} 降级回复
     */
    process(message) {
        // 检查关键词匹配
        for (const [keyword, replies] of Object.entries(this.keywordReplies)) {
            if (message.includes(keyword)) {
                return replies[Math.floor(Math.random() * replies.length)];
            }
        }
        
        // 返回随机回复
        return this.randomReplies[Math.floor(Math.random() * this.randomReplies.length)];
    }

    /**
     * 提供维护提醒
     * 
     * 当AI服务长时间不可用时，显示维护提醒
     * 告知用户服务状态和预计恢复时间
     * 
     * @returns {string} 维护提醒消息
     */
    getMaintenanceNotice() {
        return 'AI服务正在维护中，请稍后再试。感谢您的理解与支持！';
    }

    /**
     * 提供服务状态报告
     * 
     * 返回简要的服务状态信息
     * 帮助用户了解当前可用功能
     * 
     * @returns {string} 服务状态信息
     */
    getStatusInfo() {
        return 'AI服务暂时不可用，基础功能正常运行中。';
    }
}

// 创建并导出降级处理器实例
export default new FallbackProcessor();