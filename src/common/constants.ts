// filepath: c:\project\vector-storage\src\common\constants.ts
/**
 * 定义常量
 * 包含向量存储使用的默认配置值和API地址
 */
export const constants = {
  DEFAULT_DEBOUNCE_TIME: 0,           // 默认防抖时间（毫秒）
  DEFAULT_MAX_SIZE_IN_MB: 2048,       // 默认最大存储容量（MB）
  DEFAULT_OPENAI_MODEL: 'text-embedding-ada-002', // 默认OpenAI嵌入模型
  OPENAI_API_URL: 'https://api.openai.com/v1/embeddings', // OpenAI嵌入API地址
};
