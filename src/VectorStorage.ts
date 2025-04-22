// 导入必要的接口和类型定义
import { ICreateEmbeddingResponse } from './types/ICreateEmbeddingResponse';
import { IDBPDatabase, openDB } from 'idb';
import { IVSDocument, IVSSimilaritySearchItem } from './types/IVSDocument';
import { IVSOptions } from './types/IVSOptions';
import { IVSSimilaritySearchParams } from './types/IVSSimilaritySearchParams';
import { constants } from './common/constants';
import { filterDocuments, getObjectSizeInMB } from './common/helpers';

/**
 * 向量存储类，用于存储和检索文本向量表示
 * 支持相似度搜索功能
 */
export class VectorStorage<T> {
  private db!: IDBPDatabase<any>; // IndexedDB 数据库实例
  private documents: Array<IVSDocument<T>> = []; // 文档存储数组
  private readonly maxSizeInMB: number; // 最大存储容量（MB）
  private readonly debounceTime: number; // 防抖时间（毫秒）
  private readonly openaiModel: string; // OpenAI 模型名称
  private readonly openaiApiKey?: string; // OpenAI API密钥
  private readonly embedTextsFn: (texts: string[]) => Promise<number[][]>; // 文本嵌入函数

  /**
   * 构造函数，初始化向量存储
   * @param options 配置选项
   */
  constructor(options: IVSOptions = {}) {
    this.maxSizeInMB = options.maxSizeInMB ?? constants.DEFAULT_MAX_SIZE_IN_MB;
    this.debounceTime = options.debounceTime ?? constants.DEFAULT_DEBOUNCE_TIME;
    this.openaiModel = options.openaiModel ?? constants.DEFAULT_OPENAI_MODEL;
    this.embedTextsFn = options.embedTextsFn ?? this.embedTexts; // 如果提供了自定义函数则使用，否则使用默认方法
    this.openaiApiKey = options.openAIApiKey;
    if (!this.openaiApiKey && !options.embedTextsFn) {
      console.error('VectorStorage: 请在选项中提供OpenAI API密钥或自定义embedTextsFn函数。');
    } else {
      this.loadFromIndexDbStorage();
    }
  }

  /**
   * 添加单个文本到向量存储
   * @param text 要添加的文本
   * @param metadata 关联的元数据
   * @returns 添加的文档
   */
  public async addText(text: string, metadata: T): Promise<IVSDocument<T>> {
    // 从文本和元数据创建文档
    const doc: IVSDocument<T> = {
      metadata,
      text,
      timestamp: Date.now(),
      vector: [],
      vectorMag: 0,
    };
    const docs = await this.addDocuments([doc]);
    return docs[0];
  }

  /**
   * 批量添加多个文本到向量存储
   * @param texts 文本数组
   * @param metadatas 元数据数组
   * @returns 添加的文档数组
   */
  public async addTexts(texts: string[], metadatas: T[]): Promise<Array<IVSDocument<T>>> {
    if (texts.length !== metadatas.length) {
      throw new Error('文本数组和元数据数组的长度必须匹配。');
    }
    const docs: Array<IVSDocument<T>> = texts.map((text, index) => ({
      metadata: metadatas[index],
      text,
      timestamp: Date.now(),
      vector: [],
      vectorMag: 0,
    }));
    return await this.addDocuments(docs);
  }

  /**
   * 相似度搜索，查找与查询文本最相似的文档
   * @param params 搜索参数
   * @returns 相似项和查询信息
   */
  public async similaritySearch(params: IVSSimilaritySearchParams): Promise<{
    similarItems: Array<IVSSimilaritySearchItem<T>>;
    query: { text: string; embedding: number[] };
  }> {
    const { query, k = 4, filterOptions, includeValues } = params;
    const queryEmbedding = await this.embedText(query);
    const queryMagnitude = await this.calculateMagnitude(queryEmbedding);
    const filteredDocuments = filterDocuments(this.documents, filterOptions);
    const scoresPairs: Array<[IVSDocument<T>, number]> = this.calculateSimilarityScores(filteredDocuments, queryEmbedding, queryMagnitude);
    const sortedPairs = scoresPairs.sort((a, b) => b[1] - a[1]);
    const results = sortedPairs.slice(0, k).map((pair) => ({ ...pair[0], score: pair[1] }));
    this.updateHitCounters(results);
    if (results.length > 0) {
      this.removeDocsLRU();
      await this.saveToIndexDbStorage();
    }
    if (!includeValues) {
      results.forEach((result) => {
        delete result.vector;
        delete result.vectorMag;
      });
    }
    return {
      query: { embedding: queryEmbedding, text: query },
      similarItems: results,
    };
  }

  /**
   * 初始化IndexedDB数据库
   * @returns 数据库实例
   */
  private async initDB(): Promise<IDBPDatabase<any>> {
    return await openDB<any>('VectorStorageDatabase', undefined, {
      upgrade(db: IDBPDatabase<any>) {
        // 创建对象存储空间
        const documentStore = db.createObjectStore('documents', {
          autoIncrement: true,
          keyPath: 'id',
        });
        documentStore.createIndex('text', 'text', { unique: true });
        documentStore.createIndex('metadata', 'metadata');
        documentStore.createIndex('timestamp', 'timestamp');
        documentStore.createIndex('vector', 'vector');
        documentStore.createIndex('vectorMag', 'vectorMag');
        documentStore.createIndex('hits', 'hits');
      },
    });
  }

  /**
   * 添加文档到存储
   * @param documents 要添加的文档数组
   * @returns 添加的文档数组
   */
  private async addDocuments(documents: Array<IVSDocument<T>>): Promise<Array<IVSDocument<T>>> {
    // 过滤掉已经存在的文档
    const newDocuments = documents.filter((doc) => !this.documents.some((d) => d.text === doc.text));
    // 如果没有新文档，返回空数组
    if (newDocuments.length === 0) {
      return [];
    }
    const newVectors = await this.embedTextsFn(newDocuments.map((doc) => doc.text));
    // 为新文档分配向量并预计算向量大小
    newDocuments.forEach((doc, index) => {
      doc.vector = newVectors[index];
      doc.vectorMag = calcVectorMagnitude(doc);
    });
    // 将新文档添加到存储中
    this.documents.push(...newDocuments);
    this.removeDocsLRU();
    // 保存到IndexedDB存储
    await this.saveToIndexDbStorage();
    return newDocuments;
  }

  /**
   * 使用OpenAI API将文本转换为嵌入向量
   * @param texts 文本数组
   * @returns 嵌入向量数组
   */
  private async embedTexts(texts: string[]): Promise<number[][]> {
    const response = await fetch(constants.OPENAI_API_URL, {
      body: JSON.stringify({
        input: texts,
        model: this.openaiModel,
      }),
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP错误！状态码：${response.status}`);
    }

    const responseData = (await response.json()) as ICreateEmbeddingResponse;
    return responseData.data.map((data) => data.embedding);
  }

  /**
   * 对单个文本进行嵌入
   * @param query 查询文本
   * @returns 嵌入向量
   */
  private async embedText(query: string): Promise<number[]> {
    return (await this.embedTextsFn([query]))[0];
  }

  /**
   * 计算向量的大小（模长）
   * @param embedding 嵌入向量
   * @returns 向量大小
   */
  private calculateMagnitude(embedding: number[]): number {
    const queryMagnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return queryMagnitude;
  }

  /**
   * 计算相似度分数
   * @param filteredDocuments 过滤后的文档
   * @param queryVector 查询向量
   * @param queryMagnitude 查询向量大小
   * @returns 文档和相似度分数对
   */
  private calculateSimilarityScores(filteredDocuments: Array<IVSDocument<T>>, queryVector: number[], queryMagnitude: number): Array<[IVSDocument<T>, number]> {
    return filteredDocuments.map((doc) => {
      const dotProduct = doc.vector!.reduce((sum, val, i) => sum + val * queryVector[i], 0);
      let score = getCosineSimilarityScore(dotProduct, doc.vectorMag!, queryMagnitude);
      score = normalizeScore(score); // 标准化分数
      return [doc, score];
    });
  }

  /**
   * 更新命中计数器
   * @param results 搜索结果
   */
  private updateHitCounters(results: Array<IVSDocument<T>>): void {
    results.forEach((doc) => {
      doc.hits = (doc.hits ?? 0) + 1; // 更新命中计数
    });
  }

  /**
   * 从IndexedDB加载数据
   */
  private async loadFromIndexDbStorage(): Promise<void> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    this.documents = await this.db.getAll('documents');
    this.removeDocsLRU();
  }

  /**
   * 保存数据到IndexedDB
   */
  private async saveToIndexDbStorage(): Promise<void> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    try {
      const tx = this.db.transaction('documents', 'readwrite');
      await tx.objectStore('documents').clear();
      for (const doc of this.documents) {
        // eslint-disable-next-line no-await-in-loop
        await tx.objectStore('documents').put(doc);
      }
      await tx.done;
    } catch (error: any) {
      console.error('保存到IndexedDB失败:', error.message);
    }
  }

  /**
   * 使用LRU算法移除文档，确保存储大小不超过限制
   */
  private removeDocsLRU(): void {
    if (getObjectSizeInMB(this.documents) > this.maxSizeInMB) {
      // 按命中计数（升序）然后按时间戳（升序）排序文档
      this.documents.sort((a, b) => (a.hits ?? 0) - (b.hits ?? 0) || a.timestamp - b.timestamp);

      // 移除文档直到大小低于限制
      while (getObjectSizeInMB(this.documents) > this.maxSizeInMB) {
        this.documents.shift();
      }
    }
  }
}

/**
 * 计算向量大小（模长）
 * @param doc 文档
 * @returns 向量大小
 */
function calcVectorMagnitude(doc: IVSDocument<any>): number {
  return Math.sqrt(doc.vector!.reduce((sum, val) => sum + val * val, 0));
}

/**
 * 获取余弦相似度分数
 * @param dotProduct 点积
 * @param magnitudeA 向量A大小
 * @param magnitudeB 向量B大小
 * @returns 余弦相似度
 */
function getCosineSimilarityScore(dotProduct: number, magnitudeA: number, magnitudeB: number): number {
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 标准化分数到0-1范围
 * @param score 原始分数
 * @returns 标准化分数
 */
function normalizeScore(score: number): number {
  return (score + 1) / 2;
}
