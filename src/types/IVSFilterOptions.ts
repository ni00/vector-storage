/**
 * 向量存储过滤选项接口
 * 用于定义搜索结果的过滤条件
 */
export interface IVSFilterOptions {
  include?: IVSFilterCriteria;  // 包含条件，匹配这些条件的文档将被包括在结果中
  exclude?: IVSFilterCriteria;  // 排除条件，匹配这些条件的文档将被排除在结果外
}

/**
 * 过滤条件标准接口
 * 定义了具体的过滤条件
 */
export interface IVSFilterCriteria {
  metadata?: Record<string, any>;  // 基于元数据的过滤条件
  text?: string | string[];        // 基于文本内容的过滤条件
}
