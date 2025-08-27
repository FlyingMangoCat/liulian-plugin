class ModelRouter {
  constructor() {
    this.processors = {
      image: new ImageProcessor(),
      code: new CodeProcessor(),
      general: new GeneralProcessor()
    };
  }

  async routeMessage(message, messageType = 'text') {
    if (messageType === 'image') {
      return await this.processors.image.process(message);
    }
    if (this._containsCode(message)) {
      return await this.processors.code.process(message);
    }
    return await this.processors.general.process(message);
  }

  _containsCode(message) {
    const codePatterns = [/function\s+\w+\s*\(/, /def\s+\w+\s*\(/, /console\.log/, /#include/];
    return codePatterns.some(pattern => pattern.test(message));
  }
}