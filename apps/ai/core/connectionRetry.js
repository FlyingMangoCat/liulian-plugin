class ConnectionRetry {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async withRetry(operation, operationName = 'operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`[ConnectionRetry] ${operationName} 尝试 ${attempt} 失败:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // 专门用于模型调用的重试
  async modelGenerateWithRetry(ollamaInstance, model, prompt) {
    return this.withRetry(
      () => ollamaInstance.generate(model, prompt),
      `模型调用 ${model}`
    );
  }
}

export default new ConnectionRetry();