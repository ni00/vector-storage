# Vector Storage 向量存储

Vector Storage 是一个轻量级且高效的向量数据库，用于在浏览器的 IndexedDB 中存储文档向量。该包允许您使用向量嵌入对文本文档执行语义相似性搜索。语义搜索是指能够理解文本文档和查询的含义和上下文，从而实现更准确和相关的搜索结果。Vector Storage 利用 OpenAI 嵌入将文本文档转换为向量，并提供基于余弦相似度搜索相似文档的接口。

## 功能特点

- 在 IndexedDB 中存储和管理文档向量
- 对文本文档执行相似性搜索
- 基于元数据或文本内容过滤搜索结果
- 自动管理存储大小，当空间超出限制时移除最近最少使用的文档

## 余弦相似度算法

余弦相似度是内积空间中两个非零向量之间相似性的度量。它被定义为两个向量之间角度的余弦值。余弦相似度值范围从 -1 到 1，其中 1 表示完全相似，0 表示没有相似性，-1 表示完全不相似。

在本包中，余弦相似度用于测量文档向量和查询向量之间的相似性。余弦相似度分数使用向量的点积除以它们的量级乘积计算得出。

## LRU 机制

最近最少使用（LRU）机制用于管理存储大小，并在存储大小超过指定限制时自动删除文档。文档按其命中计数（升序）然后按其时间戳（升序）排序。命中次数最少且时间戳最旧的文档将首先被移除，直到存储大小低于限制。

## 安装

使用 npm 安装该包：

```bash
npm i vector-storage
```

## 使用方法

以下是如何使用 VectorStorage 类的基本示例：

```javascript
import { VectorStorage } from "vector-storage";

// 创建 VectorStorage 实例
const vectorStore = new VectorStorage({ openAIApiKey: "your-openai-api-key" });

// 向存储中添加文本文档
await vectorStore.addText("The quick brown fox jumps over the lazy dog.", {
  category: "example",
});

// 执行相似性搜索
const results = await vectorStore.similaritySearch({
  query: "A fast fox leaps over a sleepy hound.",
});

// 显示搜索结果
console.log(results);
```

## API

### VectorStorage

用于在 IndexedDB 中管理文档向量的主类。

#### constructor(options: IVSOptions)

创建 VectorStorage 的新实例。

**options**：包含以下属性的对象：

```typescript
interface IVSOptions {
  openAIApiKey: string; // 用于生成嵌入的 OpenAI API 密钥
  maxSizeInMB?: number; // 存储的最大大小（以兆字节为单位）。默认为 2GB
  debounceTime?: number; // 保存到 IndexedDB 的去抖时间（以毫秒为单位）。默认为 0
  openaiModel?: string; // 用于生成嵌入的 OpenAI 模型。默认为 'text-embedding-ada-002'
}
```

### addText(text: string, metadata: object): Promise<IVSDocument>

向存储中添加文本文档并返回创建的文档。

- **text**：文档的文本内容。
- **metadata**：与文档关联的元数据对象。

### addTexts(texts: string[], metadatas: object[]): Promise<IVSDocument[]>

向存储中添加多个文本文档并返回创建的文档数组。

- **texts**：文档的文本内容数组。
- **metadatas**：与文档关联的元数据对象数组。

### similaritySearch(params: ISimilaritySearchParams): Promise<IVSDocument[]>

对存储的文档执行相似性搜索并返回匹配文档的数组。

**params**：包含以下属性的对象：

- **query**：搜索的查询文本或向量。
- **k**（可选）：返回的顶部结果数量（默认值：4）。
- **filterOptions**（可选）：指定搜索过滤条件的对象。

### IVSDocument 接口

IVSDocument 接口表示存储在向量数据库中的文档对象。它包含以下属性：

```typescript
interface IVSDocument {
  hits?: number; // 文档的命中次数（访问次数）。如果值为 0，则省略。
  metadata: object; // 与文档关联的用于过滤的元数据。
  text: string; // 文档的文本内容。
  timestamp: number; // 指示文档添加到存储的时间戳。
  vectorMag: number; // 文档向量的量级。
  vector: number[]; // 文档的向量表示。
}
```

## 贡献

欢迎对此项目做出贡献！如果您想贡献，请按照以下步骤操作：

1. 在 GitHub 上 Fork 该仓库。
2. 将您的 Fork 克隆到本地机器。
3. 为您的更改创建一个新分支。
4. 进行更改并将其提交到您的分支。
5. 将您的更改推送到 GitHub 上的 Fork。
6. 从您的分支向主仓库打开一个拉取请求。

请确保您的代码遵循项目的编码风格，并且所有测试在提交拉取请求前都能通过。如果您发现任何错误或有改进建议，欢迎在 GitHub 上提出问题。

## 许可证

本项目采用 MIT 许可证授权。有关完整的许可证文本，请参阅 LICENSE 文件。

版权所有 (c) Nitai Aharoni。保留所有权利。