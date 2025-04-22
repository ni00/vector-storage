import { IVSDocument } from '../types/IVSDocument';
import { IVSFilterCriteria, IVSFilterOptions } from '../types/IVSFilterOptions';

/**
 * 根据过滤选项过滤文档
 * @param documents 要过滤的文档数组
 * @param filterOptions 过滤选项
 * @returns 过滤后的文档数组
 */
export function filterDocuments(documents: Array<IVSDocument<any>>, filterOptions?: IVSFilterOptions): Array<IVSDocument<any>> {
  let filteredDocuments = documents;
  if (filterOptions) {
    if (filterOptions.include) {
      filteredDocuments = filteredDocuments.filter((doc) => matchesCriteria(doc, filterOptions.include!));
    }
    if (filterOptions.exclude) {
      filteredDocuments = filteredDocuments.filter((doc) => !matchesCriteria(doc, filterOptions.exclude!));
    }
  }
  return filteredDocuments;
}

/**
 * 检查文档是否匹配给定的过滤条件
 * @param document 要检查的文档
 * @param criteria 过滤条件
 * @returns 是否匹配
 */
function matchesCriteria(document: IVSDocument<any>, criteria: IVSFilterCriteria): boolean {
  if (criteria.metadata) {
    for (const key in criteria.metadata) {
      if (document.metadata[key] !== criteria.metadata[key]) {
        return false;
      }
    }
  }
  if (criteria.text) {
    const texts = Array.isArray(criteria.text) ? criteria.text : [criteria.text];
    if (!texts.includes(document.text)) {
      return false;
    }
  }
  return true;
}

/**
 * 获取对象大小（MB）
 * @param obj 要计算大小的对象
 * @returns 以MB为单位的对象大小
 */
export function getObjectSizeInMB(obj: object): number {
  const bytes = JSON.stringify(obj).length;
  const kilobytes = bytes / 1024;
  return kilobytes / 1024;
}

/**
 * 创建防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: any[]) {
    const context = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
}
