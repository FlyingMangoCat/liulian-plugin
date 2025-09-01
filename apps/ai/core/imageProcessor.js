import { OllamaHandler } from '../ollama.js';
import config from '../../../config/ai.js';

class ImageProcessor {
  constructor() {
    this.ollama = new OllamaHandler(config.ai.ollama.api_url);
    this.model = config.ai.ollama.models.vision;
  }

  // 简化的图片处理流程
  async process(imageDescription) {
    try {
      console.log('[ImageProcessor] 处理图片消息');
      
      // 使用带超时的处理
      const analysis = await this.processWithTimeout(imageDescription);
      
      return analysis;
    } catch (error) {
      console.error('[ImageProcessor] 处理失败:', error);
      // 超时或其他错误时使用极简分析
      return await this.minimalAnalysis(imageDescription);
    }
  }

  // 带超时控制的处理
  async processWithTimeout(imageDescription, timeoutMs = config.ai.image_processing.timeout_ms) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('图片处理超时'));
      }, timeoutMs);
      
      try {
        // 先尝试识别图像类型
        const imageType = await this.identifyImageType(imageDescription);
        
        let result;
        switch (imageType) {
          case 'meme':
            result = await this.processMeme(imageDescription);
            break;
          case 'screenshot':
            result = await this.processScreenshot(imageDescription);
            break;
          case 'photo':
            result = await this.processPhoto(imageDescription);
            break;
          default:
            result = await this.simpleButEffectiveAnalysis(imageDescription);
        }
        
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // 识别图像类型
  async identifyImageType(description) {
    // 使用关键词初步判断
    if (this.isLikelyMeme(description)) return 'meme';
    if (this.isLikelyScreenshot(description)) return 'screenshot';
    if (this.isLikelyPhoto(description)) return 'photo';
    
    // 无法确定时使用通用分析
    return 'general';
  }

  // 判断是否为表情包
  isLikelyMeme(description) {
    const memeKeywords = ['表情', '梗图', '搞笑', '幽默', 'meme', '表情包', '狗头', 'doge'];
    const lowerDesc = description.toLowerCase();
    return memeKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  // 判断是否为截图
  isLikelyScreenshot(description) {
    const screenshotKeywords = ['截图', '界面', '屏幕', '聊天记录', 'screenshot', '聊天截图', '窗口'];
    const lowerDesc = description.toLowerCase();
    return screenshotKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  // 判断是否为照片
  isLikelyPhoto(description) {
    const photoKeywords = ['照片', '拍摄', '照相', '拍照', 'photo', '自拍', '风景', '人物'];
    const lowerDesc = description.toLowerCase();
    return photoKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  // 简单但有效的分析提示词
  async simpleButEffectiveAnalysis(description) {
    // 根据描述长度选择不同的提示词
    const isShortDescription = description.length < 50;
    
    const prompt = isShortDescription ? 
      this.getShortDescriptionPrompt(description) :
      this.getDetailedDescriptionPrompt(description);
    
    return await this.ollama.generate(this.model, prompt);
  }

  // 短描述提示词（适用于简单图片）
  getShortDescriptionPrompt(description) {
    return `请描述这张图片并推测其含义：${description}
    
请用一句话描述图片内容，再用一句话推测其可能的含义或用途。`;
  }

  // 详细描述提示词（适用于复杂图片）
  getDetailedDescriptionPrompt(description) {
    return `请分析这张图片：${description}
    
请回答以下问题（每个问题用一句话）：
1. 图片中有什么主要内容？
2. 这些内容在做什么或表达什么？
3. 图片的整体氛围或情绪是什么？
4. 这张图片可能用在什么场合？`;
  }

  // 处理表情包
  async processMeme(description) {
    const prompt = `这是一个表情包：${description}
    
请回答：
1. 表情包的主要内容是什么？
2. 它可能表达什么情绪或态度？
3. 在什么情况下会使用这个表情包？

请用简短的方式回答。`;
    
    return await this.ollama.generate(this.model, prompt);
  }

  // 处理截图
  async processScreenshot(description) {
    const prompt = `这是一张截图：${description}
    
请提取截图中的关键信息：
1. 这是什么界面或应用的截图？
2. 截图中有哪些重要文字或数据？
3. 截图可能想展示或说明什么？

请简明扼要地回答。`;
    
    return await this.ollama.generate(this.model, prompt);
  }

  // 处理普通照片
  async processPhoto(description) {
    const prompt = `这是一张照片：${description}
    
请描述照片中的内容：
1. 主要人物或物体
2. 场景和环境
3. 可能的情感或氛围

请用简短的语句回答。`;
    
    return await this.ollama.generate(this.model, prompt);
  }

  // 极简分析（最后降级）
  async minimalAnalysis(description) {
    // 只提取最核心的信息
    const prompt = `请用几个词描述这张图片：${description}`;
    
    try {
      return await this.ollama.generate(this.model, prompt);
    } catch (error) {
      return "一张图片";
    }
  }
}

export default new ImageProcessor();