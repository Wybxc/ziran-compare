/**
 * Token 类型：字符串或数字对象
 */
type StringToken = string;
type NumberToken = {
  type: 'arabic' | 'chinese';
  value: number;
};
type Token = StringToken | NumberToken;

/**
 * 中文数字字符映射表
 */
const CHINESE_DIGIT_MAP: Record<string, number> = {
  // 基本数字 0-9
  零: 0,
  〇: 0,
  一: 1,
  壹: 1,
  二: 2,
  贰: 2,
  三: 3,
  叁: 3,
  四: 4,
  肆: 4,
  五: 5,
  伍: 5,
  六: 6,
  陆: 6,
  七: 7,
  柒: 7,
  八: 8,
  捌: 8,
  九: 9,
  玖: 9,
  // 单位
  十: 10,
  拾: 10,
  百: 100,
  佰: 100,
  千: 1000,
  仟: 1000,
} as const;

/**
 * 分词用的正则表达式
 */
const TOKENIZE_REGEX =
  /(?<arabic>\d+)|(?<chinese>[零〇一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾百千佰仟]+)/g;

/**
 * 检查字符串是否为有效的中文数字
 */
function isValidChineseNumber(str: string): boolean {
  if (!str) return false;

  // 单独的单位词不是有效数字
  if (/^(百|佰|千|仟)+$/.test(str)) return false;

  // 重复单位不是有效数字
  if (/(百|佰|千|仟){2,}/.test(str)) return false;

  // 所有字符都必须是数字字符
  return str.split('').every((char) => char in CHINESE_DIGIT_MAP);
}

/**
 * 将中文数字转换为阿拉伯数字
 * @param chineseNum 中文数字字符串
 * @returns 对应的阿拉伯数字，如果无法转换则返回 null
 */
function parseChineseNumber(chineseNum: string): number | null {
  if (!chineseNum || !isValidChineseNumber(chineseNum)) {
    return null;
  }

  // 处理特殊情况：单独的零和十
  if (chineseNum === '零' || chineseNum === '〇') return 0;
  if (chineseNum === '十' || chineseNum === '拾') return 10;

  let result = 0;
  let currentNumber = 0;

  for (const char of chineseNum) {
    const value = CHINESE_DIGIT_MAP[char];

    if (value >= 10) {
      // 遇到单位（十、百、千）
      if (currentNumber === 0) {
        currentNumber = 1; // 处理"十"在开头的情况，如"十二"
      }
      result += currentNumber * value;
      currentNumber = 0;
    } else {
      // 遇到基础数字 0-9
      currentNumber = value;
    }
  }

  return result + currentNumber;
}

/**
 * 将字符串分词为 Token 数组
 * @param str 输入字符串
 * @returns Token 数组
 */
function tokenize(str: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 重置正则表达式的状态
  TOKENIZE_REGEX.lastIndex = 0;

  while ((match = TOKENIZE_REGEX.exec(str)) !== null) {
    // 添加数字前的字符串部分
    if (match.index > lastIndex) {
      tokens.push(str.slice(lastIndex, match.index));
    }

    const { arabic, chinese } = match.groups!;

    if (arabic) {
      tokens.push({ type: 'arabic', value: Number(arabic) });
    } else if (chinese) {
      const numValue = parseChineseNumber(chinese);
      if (numValue !== null) {
        tokens.push({ type: 'chinese', value: numValue });
      } else {
        // 无法转换的中文数字，作为普通字符串处理
        tokens.push(chinese);
      }
    }

    lastIndex = TOKENIZE_REGEX.lastIndex;
  }

  // 添加最后剩余的字符串部分
  if (lastIndex < str.length) {
    tokens.push(str.slice(lastIndex));
  }

  return tokens;
}

/**
 * 比较选项
 */
export interface CompareOptions {
  /**
   * 如何处理数字和字符串的比较
   * - 'numberFirst': 数字优先于字符串
   * - 'stringFirst': 字符串优先于数字
   * @default 'numberFirst'
   */
  numberStringPolicy?: 'numberFirst' | 'stringFirst';

  /**
   * 如何处理中文数字与阿拉伯数字的比较
   * - 'mixed': 混合比较，按数值大小比较
   * - 'first': 中文数字优先于阿拉伯数字
   * - 'last': 阿拉伯数字优先于中文数字
   * @default 'mixed'
   */
  chineseNumberPolicy?: 'mixed' | 'first' | 'last';
}

/**
 * 寻找两个字符串的公共前缀长度
 */
function findCommonPrefixLength(str1: string, str2: string): number {
  const minLength = Math.min(str1.length, str2.length);

  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i]) {
      return i;
    }
  }

  return minLength;
}

/**
 * 尝试重新分词单一字符串token以匹配多token结构
 */
function tryRetokenizeSingle(
  singleTokens: Token[],
  multiTokens: Token[],
): Token[] | null {
  const singleStr = singleTokens[0] as string;
  const firstStr = multiTokens[0] as string;

  const commonLength = findCommonPrefixLength(singleStr, firstStr);

  if (commonLength > 0) {
    const prefix = singleStr.slice(0, commonLength);
    const suffix = singleStr.slice(commonLength);
    return suffix ? [prefix, suffix] : [prefix];
  }

  return null;
}

/**
 * 启发式重新分词：当一边是单一字符串token，另一边是多个token时，
 * 尝试从单一字符串中提取公共前缀，使两边的分词更一致
 */
function applyHeuristicTokenization(
  tokensA: Token[],
  tokensB: Token[],
): [Token[], Token[]] {
  // tokensA 是单一字符串，tokensB 是多个 token
  if (
    tokensA.length === 1 &&
    typeof tokensA[0] === 'string' &&
    tokensB.length > 1 &&
    typeof tokensB[0] === 'string'
  ) {
    const newTokensA = tryRetokenizeSingle(tokensA, tokensB);
    if (newTokensA) return [newTokensA, tokensB];
  }

  // tokensB 是单一字符串，tokensA 是多个 token
  if (
    tokensB.length === 1 &&
    typeof tokensB[0] === 'string' &&
    tokensA.length > 1 &&
    typeof tokensA[0] === 'string'
  ) {
    const newTokensB = tryRetokenizeSingle(tokensB, tokensA);
    if (newTokensB) return [tokensA, newTokensB];
  }

  return [tokensA, tokensB];
} /**
 * 比较两个 token
 */
function compareTokens(
  tokenA: Token | undefined,
  tokenB: Token | undefined,
  options: Required<CompareOptions>,
): number {
  // 处理未定义的情况
  if (tokenA === undefined && tokenB === undefined) return 0;
  if (tokenA === undefined) return -1;
  if (tokenB === undefined) return 1;

  const isStringA = typeof tokenA === 'string';
  const isStringB = typeof tokenB === 'string';

  // 都是字符串
  if (isStringA && isStringB) {
    return (tokenA as string).localeCompare(tokenB as string, 'zh-CN');
  }

  // 都是数字
  if (!isStringA && !isStringB) {
    const numA = tokenA as NumberToken;
    const numB = tokenB as NumberToken;

    // 处理不同类型数字的比较策略
    if (options.chineseNumberPolicy !== 'mixed' && numA.type !== numB.type) {
      if (options.chineseNumberPolicy === 'first') {
        // 中文数字优先
        if (numA.type === 'chinese' && numB.type === 'arabic') return -1;
        if (numA.type === 'arabic' && numB.type === 'chinese') return 1;
      } else if (options.chineseNumberPolicy === 'last') {
        // 阿拉伯数字优先
        if (numA.type === 'arabic' && numB.type === 'chinese') return -1;
        if (numA.type === 'chinese' && numB.type === 'arabic') return 1;
      }
    }

    // 按数值大小比较
    const diff = numA.value - numB.value;
    return diff === 0 ? 0 : diff > 0 ? 1 : -1;
  }

  // 一个是字符串，一个是数字
  if (isStringA && !isStringB) {
    return options.numberStringPolicy === 'numberFirst' ? 1 : -1;
  }

  // tokenA 是数字，tokenB 是字符串
  return options.numberStringPolicy === 'numberFirst' ? -1 : 1;
}

/**
 * 自然排序比较函数，支持中文数字和阿拉伯数字的智能比较
 * @param a 第一个字符串
 * @param b 第二个字符串
 * @param options 比较选项
 * @returns 比较结果：< 0 表示 a < b，= 0 表示 a = b，> 0 表示 a > b
 */
export function ziRanCompare(
  a: string,
  b: string,
  options: CompareOptions = {},
): number {
  // 设置默认选项
  const finalOptions: Required<CompareOptions> = {
    chineseNumberPolicy: options.chineseNumberPolicy ?? 'mixed',
    numberStringPolicy: options.numberStringPolicy ?? 'numberFirst',
  };

  // 分词
  let tokensA = tokenize(a);
  let tokensB = tokenize(b);

  // 应用启发式分词
  [tokensA, tokensB] = applyHeuristicTokenization(tokensA, tokensB);

  // 逐个比较 token
  const maxLength = Math.max(tokensA.length, tokensB.length);

  for (let i = 0; i < maxLength; i++) {
    const result = compareTokens(tokensA[i], tokensB[i], finalOptions);
    if (result !== 0) {
      return result;
    }
  }

  return 0;
}
