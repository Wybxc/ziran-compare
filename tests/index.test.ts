import { expect, test } from '@rstest/core';
import { ziRanCompare } from '../src/index';

test('basic chinese number conversion', () => {
  // 基础数字比较
  expect(ziRanCompare('一', '二')).toBeLessThan(0);
  expect(ziRanCompare('九', '十')).toBeLessThan(0);
  expect(ziRanCompare('十', '二十')).toBeLessThan(0);

  // 中文数字与阿拉伯数字比较
  expect(ziRanCompare('一', '1')).toBe(0); // 混合模式下数值相等
  expect(ziRanCompare('十', '10')).toBe(0);
  expect(ziRanCompare('二十三', '23')).toBe(0);
});

test('complex chinese numbers', () => {
  // 复杂中文数字（限制在千以内）
  expect(ziRanCompare('一百二十三', '九十九')).toBeGreaterThan(0);
  expect(ziRanCompare('三千五百', '三千四百九十九')).toBeGreaterThan(0);
  expect(ziRanCompare('九千九百九十九', '1000')).toBeGreaterThan(0);

  // 繁体数字
  expect(ziRanCompare('壹', '一')).toBe(0);
  expect(ziRanCompare('贰拾叁', '二十三')).toBe(0);
  expect(ziRanCompare('九仟九佰九拾九', '九千九百九十九')).toBe(0);
});

test('mixed string and number sorting', () => {
  // 字符串中包含数字的自然排序
  expect(ziRanCompare('文件1', '文件2')).toBeLessThan(0);
  expect(ziRanCompare('文件2', '文件10')).toBeLessThan(0);
  expect(ziRanCompare('文件九', '文件十')).toBeLessThan(0);
  expect(ziRanCompare('第一章', '第二章')).toBeLessThan(0);
  expect(ziRanCompare('第九章', '第十章')).toBeLessThan(0);
});

test('chinese number policy options', () => {
  // 测试不同的中文数字策略

  // mixed 模式：按数值比较
  expect(ziRanCompare('一', '1', { chineseNumberPolicy: 'mixed' })).toBe(0);

  // first 模式：中文数字优先
  expect(
    ziRanCompare('一', '1', { chineseNumberPolicy: 'first' }),
  ).toBeLessThan(0);
  expect(
    ziRanCompare('1', '一', { chineseNumberPolicy: 'first' }),
  ).toBeGreaterThan(0);

  // last 模式：阿拉伯数字优先
  expect(
    ziRanCompare('一', '1', { chineseNumberPolicy: 'last' }),
  ).toBeGreaterThan(0);
  expect(ziRanCompare('1', '一', { chineseNumberPolicy: 'last' })).toBeLessThan(
    0,
  );
});

test('numbers within thousands range', () => {
  // 千以内的数字测试
  expect(ziRanCompare('九百九十九', '999')).toBe(0);
  expect(ziRanCompare('一千', '1000')).toBe(0);
  expect(ziRanCompare('三千五百', '3500')).toBe(0);
  expect(ziRanCompare('九千九百九十九', '9999')).toBe(0);

  // 复杂千级别数字
  expect(ziRanCompare('三千五百二十一', '3521')).toBe(0);
  expect(ziRanCompare('八千零六', '8006')).toBe(0);
  expect(ziRanCompare('六千零七十', '6070')).toBe(0);
});

test('number comparisons within range', () => {
  // 千以内数字之间的比较
  expect(ziRanCompare('九百九十九', '一千')).toBeLessThan(0);
  expect(ziRanCompare('九千九百九十九', '一千')).toBeGreaterThan(0);

  // 跨百位比较
  expect(ziRanCompare('九十九', '一百')).toBeLessThan(0);
  expect(ziRanCompare('九百九十九', '1000')).toBeLessThan(0);

  // 相近数字比较
  expect(ziRanCompare('一千', '九百九十九')).toBeGreaterThan(0);
  expect(ziRanCompare('九千九百九十八', '九千九百九十九')).toBeLessThan(0);
});

test('zero handling in numbers', () => {
  // 零在数字中的处理
  expect(ziRanCompare('一千零一', '1001')).toBe(0);
  expect(ziRanCompare('三千零七', '3007')).toBe(0);
  expect(ziRanCompare('五千零六十七', '5067')).toBe(0);
  expect(ziRanCompare('八千零九', '8009')).toBe(0);

  // 多个零的情况
  expect(ziRanCompare('一千零一十', '1010')).toBe(0);
  expect(ziRanCompare('九千零九', '9009')).toBe(0);
});

test('mixed numbers in strings', () => {
  // 字符串中的数字自然排序
  expect(ziRanCompare('版本1千', '版本2千')).toBeLessThan(0);
  expect(ziRanCompare('版本九百', '版本一千')).toBeLessThan(0);
  expect(ziRanCompare('用户九千九百九十九', '用户10000')).toBeLessThan(0);

  // 文档编号测试
  expect(ziRanCompare('文档编号一千', '文档编号九百九十九')).toBeGreaterThan(0);
  expect(ziRanCompare('报告第九千九百九十九号', '报告第10000号')).toBeLessThan(
    0,
  );
});

test('complex mixed scenarios', () => {
  // 复杂混合场景（限制在千以内）
  expect(ziRanCompare('用户ID一千二百三十四号', '用户ID1234号')).toBe(0);
  expect(ziRanCompare('第九千九百九十九页', '第9999页')).toBe(0);

  // 多个数字的字符串
  expect(ziRanCompare('章节一点二', '章节1点2')).toBe(0);
  expect(ziRanCompare('版本二点零点三', '版本2点0点3')).toBe(0);

  // 数字后跟文字再跟数字
  expect(ziRanCompare('第一章第二节', '第1章第2节')).toBe(0);
  expect(ziRanCompare('第九章第十节', '第9章第10节')).toBe(0);
});

test('boundary values within range', () => {
  // 边界值测试（千以内）
  expect(ziRanCompare('九千九百九十九', '9999')).toBe(0);

  // 确保数字比较的正确性
  expect(ziRanCompare('一千', '九百九十九')).toBeGreaterThan(0);
  expect(ziRanCompare('九千九百九十八', '九千九百九十九')).toBeLessThan(0);
});

test('numberStringPolicy options', () => {
  // 测试 numberStringPolicy 选项

  // 默认情况：numberFirst
  expect(ziRanCompare('a', '1')).toBeGreaterThan(0); // 字符串排在数字后面
  expect(ziRanCompare('1', 'a')).toBeLessThan(0); // 数字排在字符串前面

  // 显式设置 numberFirst
  expect(
    ziRanCompare('a', '1', { numberStringPolicy: 'numberFirst' }),
  ).toBeGreaterThan(0);
  expect(
    ziRanCompare('1', 'a', { numberStringPolicy: 'numberFirst' }),
  ).toBeLessThan(0);

  // 设置 stringFirst
  expect(
    ziRanCompare('a', '1', { numberStringPolicy: 'stringFirst' }),
  ).toBeLessThan(0);
  expect(
    ziRanCompare('1', 'a', { numberStringPolicy: 'stringFirst' }),
  ).toBeGreaterThan(0);

  // 混合场景测试 - 使用能产生一致分词的字符串
  expect(
    ziRanCompare('a1', '1a', { numberStringPolicy: 'numberFirst' }),
  ).toBeGreaterThan(0); // 'a' vs 1，numberFirst时数字在前
  expect(
    ziRanCompare('a1', '1a', { numberStringPolicy: 'stringFirst' }),
  ).toBeLessThan(0); // 'a' vs 1，stringFirst时字符串在前

  // 中文数字与阿拉伯数字比较
  expect(
    ziRanCompare('a', '一', { numberStringPolicy: 'numberFirst' }),
  ).toBeGreaterThan(0);
  expect(
    ziRanCompare('a', '一', { numberStringPolicy: 'stringFirst' }),
  ).toBeLessThan(0);

  // 启发式分词
  expect(
    ziRanCompare('文件a', '文件1', { numberStringPolicy: 'numberFirst' }),
  ).toBeGreaterThan(0);
  expect(
    ziRanCompare('文件a', '文件1', { numberStringPolicy: 'stringFirst' }),
  ).toBeLessThan(0);
  expect(
    ziRanCompare('文件a文件b', '文件1文件b', {
      numberStringPolicy: 'numberFirst',
    }),
  ).toBeGreaterThan(0);
  expect(
    ziRanCompare('文件a文件b', '文件1文件b', {
      numberStringPolicy: 'stringFirst',
    }),
  ).toBeLessThan(0);
});

test('edge cases', () => {
  // 边界情况
  expect(ziRanCompare('', '')).toBe(0);
  expect(ziRanCompare('abc', 'abc')).toBe(0);
  expect(ziRanCompare('零', '0')).toBe(0);

  // 特殊的中文数字表示
  expect(ziRanCompare('十', '一十')).toBe(0); // "十" 和 "一十" 应该相等

  // 单独的单位词不视为数字
  expect(ziRanCompare('千', '0')).toBeGreaterThan(0);
  expect(ziRanCompare('百', '0')).toBeGreaterThan(0);

  // 无效或不完整的中文数字
  expect(ziRanCompare('一二三', '123')).not.toBe(0); // 连续数字字符应该被当作字符串处理

  // 重复单位不视为数字
  expect(ziRanCompare('千千', '0')).toBeGreaterThan(0);
  expect(ziRanCompare('百百', '0')).toBeGreaterThan(0);
  expect(ziRanCompare('千百', '0')).toBeGreaterThan(0);

  // 混合无效字符
  expect(ziRanCompare('一abc二', '1abc2')).toBe(0); // 数字被正确识别，其他部分按字符串比较

  // 空字符和一个字符的比较
  expect(ziRanCompare('', '一')).toBeLessThan(0);
  expect(ziRanCompare('一', '')).toBeGreaterThan(0);
});
