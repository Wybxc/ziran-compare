# ziran-compare

一个轻量、强大、支持中文数字的自然排序库。

`ziran-compare` (自然比较) 是一个为 JavaScript/TypeScript 设计的自然排序库。它能够智能地处理包含阿拉伯数字 (1, 2, 3) 和中文数字 (一, 二, 三, 十, 百) 的字符串，实现更符合人类直觉的排序结果。

## ✨ 特性

- **自然排序**: 正确排序包含数字的字符串，例如 "第10章" 会排在 "第2章" 之后。
- **中文数字支持**: 智能识别并转换中文数字，包括简体 (`一`, `二`) 和大写 (`壹`, `贰`) 形式。
- **高度可定制**:
  - 自定义数字与字符串的排序优先级。
  - 自定义中文数字与阿拉伯数字的排序优先级。
- **启发式分词**: 通过智能分词算法，更精确地比较复杂字符串。
- **TypeScript 支持**: 使用 TypeScript 编写，提供完整的类型定义。

## 📦 安装

```bash
# 使用 bun
bun install ziran-compare

# 使用 npm
npm install ziran-compare

# 使用 pnpm
pnpm install ziran-compare
```

## 🚀 使用方法

`ziran-compare` 可以直接用于数组的 `sort` 方法。

### 基本用法

```typescript
import { ziRanCompare } from 'ziran-compare';

const list = ['第10章', '第2章', '第1章'];
list.sort(ziRanCompare);

console.log(list);
// 输出: ['第1章', '第2章', '第10章']
```

### 中文数字排序

```typescript
import { ziRanCompare } from 'ziran-compare';

const list = ['文件十', '文件二', '文件一'];
list.sort(ziRanCompare);

console.log(list);
// 输出: ['文件一', '文件二', '文件十']
```

### 混合数字排序

`ziran-compare` 默认会把中文和阿拉伯数字看作相同类型进行比较。

```typescript
import { ziRanCompare } from 'ziran-compare';

const list = ['第十节', '第2节', '第一节'];
list.sort(ziRanCompare);

console.log(list);
// 输出: ['第一节', '第2节', '第十节']
```

## 📚 API

### `ziRanCompare(a: string, b: string, options?: CompareOptions): number`

比较两个字符串 `a` 和 `b`。返回值与标准的 `compareFunction` 兼容：

- `< 0`: `a` 排在 `b` 前面。
- `> 0`: `b` 排在 `a` 前面。
- `= 0`: `a` 和 `b` 的排序位置相同。

#### `options: CompareOptions`

一个可选的配置对象，用于自定义排序行为。

| 选项 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `numberStringPolicy` | `'numberFirst'` \| `'stringFirst'` | `'numberFirst'` | 定义数字与字符串混合时的排序策略。 |
| `chineseNumberPolicy` | `'mixed'` \| `'first'` \| `'last'` | `'mixed'` | 定义中文数字与阿拉伯数字的比较策略。 |

## 🛠️ 开发

本项目使用 [Bun](https://bun.sh/) 作为包管理器。

1. **克隆仓库**

   ```bash
   git clone <repository-url>
   cd ziran-compare
   ```

2. **安装依赖**

   ```bash
   bun install
   ```

3. **可用脚本**

   - `bun run build`: 构建生产版本的代码。
   - `bun run dev`: 以观察模式构建，用于开发。
   - `bun run test`: 运行测试。
   - `bun run check`: 使用 Biome 检查代码风格并自动修复。
   - `bun run format`: 使用 Biome 格式化代码。

## 📄 许可证

MIT
