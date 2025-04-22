/**
 * 矢量存储模块的主入口文件
 * 导出所有必要的类和类型定义
 */

// 导出主要的 VectorStorage 类
export { VectorStorage } from './VectorStorage';
// 导出配置选项接口
export type { IVSOptions } from './types/IVSOptions';
// 导出文档和相似度搜索结果项接口
export type { IVSDocument, IVSSimilaritySearchItem } from './types/IVSDocument';
// 导出过滤选项接口
export type { IVSFilterOptions } from './types/IVSFilterOptions';
// 导出相似度搜索参数接口
export type { IVSSimilaritySearchParams } from './types/IVSSimilaritySearchParams';
