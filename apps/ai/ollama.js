import fetch from 'node-fetch';

class OllamaHandler {
  constructor(baseURL) {
    // 确保 baseURL 不包含 /api/generate
    this.baseURL = baseURL.replace(/\/api\/generate$/, '');
    console.log('[OllamaHandler] 初始化，基础URL:', this.baseURL);
  }

  async generate(model, prompt, system = null) {
    try {
      const requestData = { model, prompt, stream: false };
      if (system) requestData.system = system;

      const apiUrl = `${this.baseURL}/api/generate`;
      console.log('[Ollama请求] 目标URL:', apiUrl);
      console.log('[Ollama请求] 使用模型:', model);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('[Ollama请求] 响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Ollama请求] 错误响应:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Ollama请求] 成功获取回复');
      return data.response;
    } catch (error) {
      console.error('[Ollama请求错误]', error.message);
      throw error;
    }
  }
}

export { OllamaHandler };