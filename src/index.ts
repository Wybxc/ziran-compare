type Token = string | {
    type: 'number' | 'chineseNumber';
    value: number;
}

/**
 * 中文数字映射表
 */
const CHINESE_NUMBER_MAP: Record<string, number> = {
    '零': 0, '〇': 0,
    '一': 1, '壹': 1,
    '二': 2, '贰': 2,
    '三': 3, '叁': 3,
    '四': 4, '肆': 4,
    '五': 5, '伍': 5,
    '六': 6, '陆': 6,
    '七': 7, '柒': 7,
    '八': 8, '捌': 8,
    '九': 9, '玖': 9,
    '十': 10, '拾': 10,
    '百': 100, '佰': 100,
    '千': 1000, '仟': 1000
};

/**
 * 将中文数字转换为阿拉伯数字
 * @param chineseNum 中文数字字符串
 * @returns 对应的阿拉伯数字
 */
function chineseToNumber(chineseNum: string): number | null {
    if (chineseNum.length === 0) return 0;

    // 处理特殊情况 - 单独的单位词和零
    if (chineseNum === '零' || chineseNum === '〇') return 0;
    if (chineseNum === '十' || chineseNum === '拾') return 10;

    // 单独的单位词不视为数字
    if (chineseNum.match(/^(百|佰|千|仟)+$/)) return null;

    let result = 0;
    let temp = 0;

    for (let i = 0; i < chineseNum.length; i++) {
        const char = chineseNum[i];
        const value = CHINESE_NUMBER_MAP[char];

        if (value === undefined) {
            // 遇到无法识别的字符，返回 0
            return 0;
        }

        if (value >= 10) {
            // 十、百、千等单位
            if (temp === 0) {
                temp = 1; // 处理"十"在开头的情况，如"十二"
            }
            result += temp * value;
            temp = 0;
        } else {
            // 基础数字 0-9
            temp = value;
        }
    }

    result += temp;
    return result;
}

/**
 * 拆分字符串为数组，数组元素为字符串或数字
 * @param str 字符串
 * @returns 数组
 */
function preprocess(str: string): Token[] {
    // 匹配阿拉伯数字和中文数字（包括繁体和简体，限制到千以内）
    const reg = /(?<arabicNum>\d+)|(?<chineseNum>[零〇一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾百千佰仟]+)/g;
    const result: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = reg.exec(str)) !== null) {
        // 添加数字前的字符串部分
        if (match.index > lastIndex) {
            result.push(str.slice(lastIndex, match.index));
        }

        const { arabicNum, chineseNum } = match.groups!;

        if (arabicNum) {
            result.push({ type: 'number', value: Number(arabicNum) });
        } else if (chineseNum) {
            // 分割中文数字，处理重复单位
            const numValue = chineseToNumber(chineseNum);
            if (numValue !== null) {
                result.push({ type: 'chineseNumber', value: numValue });
            } else {
                // 无法转换的中文数字，作为普通字符串处理
                result.push(chineseNum);
            }
        }
        lastIndex = reg.lastIndex;
    }

    // 添加最后剩余的字符串部分
    if (lastIndex < str.length) {
        result.push(str.slice(lastIndex));
    }

    return result;
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
 * 启发式重新分词：当一边是单一字符串token，另一边是多个token时，
 * 尝试从单一字符串中提取公共前缀，使两边的分词更一致
 * @param tokensA 第一个字符串的token数组
 * @param tokensB 第二个字符串的token数组
 * @returns 重新分词后的token数组对
 */
function heuristicRetokenize(tokensA: Token[], tokensB: Token[]): [Token[], Token[]] {
    // 只在一边是单一字符串token，另一边有多个token时进行启发式分词
    if (tokensA.length === 1 && typeof tokensA[0] === 'string' && tokensB.length > 1) {
        const strA = tokensA[0] as string;
        const firstTokenB = tokensB[0];

        if (typeof firstTokenB === 'string') {
            // 寻找公共前缀
            let commonPrefixLen = 0;
            const minLen = Math.min(strA.length, firstTokenB.length);

            for (let i = 0; i < minLen; i++) {
                if (strA[i] === firstTokenB[i]) {
                    commonPrefixLen++;
                } else {
                    break;
                }
            }

            // 如果有公共前缀，重新分词
            if (commonPrefixLen > 0) {
                const prefix = strA.slice(0, commonPrefixLen);
                const suffixA = strA.slice(commonPrefixLen);

                const newTokensA = suffixA ? [prefix, suffixA] : [prefix];
                return [newTokensA, tokensB];
            }
        }
    }

    // 反向处理
    if (tokensB.length === 1 && typeof tokensB[0] === 'string' && tokensA.length > 1) {
        const strB = tokensB[0] as string;
        const firstTokenA = tokensA[0];

        if (typeof firstTokenA === 'string') {
            // 寻找公共前缀
            let commonPrefixLen = 0;
            const minLen = Math.min(strB.length, firstTokenA.length);

            for (let i = 0; i < minLen; i++) {
                if (strB[i] === firstTokenA[i]) {
                    commonPrefixLen++;
                } else {
                    break;
                }
            }

            // 如果有公共前缀，重新分词
            if (commonPrefixLen > 0) {
                const prefix = strB.slice(0, commonPrefixLen);
                const suffixB = strB.slice(commonPrefixLen);

                const newTokensB = suffixB ? [prefix, suffixB] : [prefix];
                return [tokensA, newTokensB];
            }
        }
    }

    return [tokensA, tokensB];
}

/**
 * 自然排序比较函数，支持中文数字和阿拉伯数字的智能比较
 * @param a 第一个字符串
 * @param b 第二个字符串
 * @param options 比较选项
 * @returns 比较结果：< 0 表示 a < b，= 0 表示 a = b，> 0 表示 a > b
 */
export function ziRanCompare(a: string, b: string, options: CompareOptions = {}): number {
    const { chineseNumberPolicy = 'mixed', numberStringPolicy = 'numberFirst' } = options;

    // 预处理字符串，将其拆分为 token 数组
    let tokensA = preprocess(a);
    let tokensB = preprocess(b);

    // 启发式重新分词
    [tokensA, tokensB] = heuristicRetokenize(tokensA, tokensB);

    const maxLength = Math.max(tokensA.length, tokensB.length);

    for (let i = 0; i < maxLength; i++) {
        const tokenA = tokensA[i];
        const tokenB = tokensB[i];

        // 如果其中一个字符串已经结束
        if (tokenA === undefined) return -1;
        if (tokenB === undefined) return 1;

        // 都是字符串，直接字符串比较
        if (typeof tokenA === 'string' && typeof tokenB === 'string') {
            const result = tokenA.localeCompare(tokenB, 'zh-CN');
            if (result !== 0) return result;
            continue;
        }

        // 都是数字类型（包括中文数字和阿拉伯数字）
        if (typeof tokenA === 'object' && typeof tokenB === 'object') {
            // 根据策略处理不同类型数字的比较
            if (chineseNumberPolicy !== 'mixed' && tokenA.type !== tokenB.type) {
                if (chineseNumberPolicy === 'first') {
                    // 中文数字优先
                    if (tokenA.type === 'chineseNumber' && tokenB.type === 'number') return -1;
                    if (tokenA.type === 'number' && tokenB.type === 'chineseNumber') return 1;
                } else if (chineseNumberPolicy === 'last') {
                    // 阿拉伯数字优先
                    if (tokenA.type === 'number' && tokenB.type === 'chineseNumber') return -1;
                    if (tokenA.type === 'chineseNumber' && tokenB.type === 'number') return 1;
                }
            }

            // 按数值大小比较
            const diff = tokenA.value - tokenB.value;
            if (diff !== 0) return diff > 0 ? 1 : -1;
            continue;
        }

        // 根据 numberStringPolicy 处理数字和字符串的比较
        if (typeof tokenA === 'string' && typeof tokenB === 'object') {
            return numberStringPolicy === 'numberFirst' ? 1 : -1;
        }
        if (typeof tokenA === 'object' && typeof tokenB === 'string') {
            return numberStringPolicy === 'numberFirst' ? -1 : 1;
        }
    }

    return 0;
}
