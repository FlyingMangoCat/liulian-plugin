import { OllamaHandler } from '../ollama.js';
import connectionRetry from './connectionRetry.js';
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
      
      // 使用带重试的处理
      const analysis = await connectionRetry.modelGenerateWithRetry(
        this.ollama,
        this.model,
        await this.getSmartPrompt(imageDescription)
      );
      
      return analysis;
    } catch (error) {
      console.error('[ImageProcessor] 处理失败:', error);
      return await this.minimalAnalysis(imageDescription);
    }
  }

  // 智能提示词选择
  async getSmartPrompt(description) {
    const type = await this.identifyImageType(description);
    
    switch (type) {
      case 'meme': return `表情包:${description}→内容/情绪/场景`;
      case 'screenshot': return `截图:${description}→界面/文字/目的`;
      case 'photo': return `照片:${description}→内容/场景/氛围`;
      default: return `图片:${description}→描述`;
    }
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

  // 极简分析（最后降级）
  async minimalAnalysis(description) {
    // 只提取最核心的信息
    const prompt = `图片:${description}→简述`;
    
    try {
      return await this.ollama.generate(this.model, prompt);
    } catch (error) {
      return "一张图片";
    }
  }
}

export default new ImageProcessor();