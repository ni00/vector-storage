/**
 * 向量存储文档接口
 * 定义了向量存储中文档的数据结构
 */
export interface IVSDocument<T> {
  hits?: number;      // 命中次数：可选字段，记录该文档在相似度搜索中被返回的次数。如果为0则省略。
  metadata: T;        // 元数据：包含关于文档的额外信息。此对象的结构可能根据应用程序而异。
  text: string;       // 文本：文档的实际文本内容。用于计算文档的向量表示。
  timestamp: number;  // 时间戳：文档添加到向量存储的时间，表示为Unix时间戳（自Unix纪元以来的毫秒数）。
  vectorMag?: number; // 向量幅度：文档向量表示的幅度。预先计算以加速相似度计算。
  vector?: number[];  // 向量：文档的向量表示。由嵌入模型（如OpenAI模型）计算。
}

/**
 * 相似度搜索结果项接口
 * 扩展了文档接口，包含相似度分数
 */
export interface IVSSimilaritySearchItem<T> extends IVSDocument<T> {
  score: number;      // 相似度分数：文档的余弦相似度分数。范围从0到1，其中1表示文档与提示极为相似或完全相同，接近0的分数表示文档与提示不相似。
}
