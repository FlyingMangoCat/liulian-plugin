import fetch from 'node-fetch';

class OllamaHandler {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async generate(model, prompt, system = null) {
    try {
      const requestData = { model, prompt, stream: false };
      if (system) requestData.system = system;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('[Ollama请求错误]', error.message);
      throw error;
    }
  }
}

export { OllamaHandler };