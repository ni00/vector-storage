/**
 * OpenAI嵌入响应接口
 * 定义了从OpenAI API接收的嵌入响应结构
 */
export interface ICreateEmbeddingResponse {
  object: string;                           // 对象类型
  model: string;                            // 使用的模型名称
  data: CreateEmbeddingResponseDataInner[]; // 包含嵌入向量的数据数组
  usage: CreateEmbeddingResponseUsage;      // API使用统计信息
}

/**
 * 嵌入响应数据项接口
 * 包含单个嵌入向量及其元数据
 */
interface CreateEmbeddingResponseDataInner {
  index: number;      // 嵌入向量的索引
  object: string;     // 对象类型
  embedding: number[]; // 嵌入向量
}

/**
 * API使用统计接口
 * 包含令牌用量信息
 */
interface CreateEmbeddingResponseUsage {
  prompt_tokens: number; // 提示使用的令牌数
  total_tokens: number;  // 总共使用的令牌数
}
