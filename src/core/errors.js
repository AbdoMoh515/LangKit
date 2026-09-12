export class LangError extends Error {
  constructor(message, { code = 1, usage } = {}) {
    super(message);
    this.name = 'LangError';
    this.code = code;
    this.usage = usage;
  }
}
