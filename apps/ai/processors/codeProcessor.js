import { OllamaHandler } from '../ollama.js'; // 复用现有的Ollama处理器

class CodeProcessor {
  constructor() {
    this.ollama = new OllamaHandler("http://192.168.0.112:11435");
    this.model = "deepseek-coder:6.7b"; // 专用代码模型
  }

  async process(message) {
    const prompt = `请分析以下代码：\n\n${message}`;
    const analysis = await this.ollama.generate(this.model, prompt);
    return `【代码分析】${analysis}`; // 返回原始结果，供主模型整理
  }
}