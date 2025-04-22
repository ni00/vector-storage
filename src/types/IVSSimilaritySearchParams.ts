import { IVSFilterOptions } from './IVSFilterOptions';

/**
 * 相似度搜索参数接口
 * 定义了执行相似度搜索所需的参数
 */
export interface IVSSimilaritySearchParams {
  query: string;         // 搜索查询文本
  k?: number;            // 要返回的结果数量
  filterOptions?: IVSFilterOptions;  // 过滤选项
  includeValues?: boolean;  // 是否在结果中包含向量值
}
