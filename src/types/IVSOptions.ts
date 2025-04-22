/**
 * 向量存储选项接口
 * 定义了初始化向量存储类时可用的配置选项
 */
export interface IVSOptions {
  openAIApiKey?: string;  // OpenAI API密钥，用于生成嵌入向量
  maxSizeInMB?: number;   // 存储的最大容量（MB），默认为4.8，不能超过5
  debounceTime?: number;  // 保存到本地存储的防抖时间（毫秒），默认为0
  openaiModel?: string;   // 用于生成嵌入向量的OpenAI模型，默认为'text-embedding-ada-002'
  embedTextsFn?: (texts: string[]) => Promise<number[][]>;  // 自定义嵌入函数选项
}
