const SKIP_CONTENTS = [
  '\u0000-\u001f',  // 控制字符：https://unicode-table.com/cn/blocks/control-character/
  '\u001f-\u0040',  // 基本拉丁字母(符号和数字)：https://unicode-table.com/cn/blocks/basic-latin/
  '\u005b-\u0060',  // 开方括号-开单引号
  '\u007b-\u007f',  // 开花括号-删除
  '\u0080-\u00ff',  // 拉丁文补充1：https://unicode-table.com/cn/blocks/latin-1-supplement/
  '\u0100-\u017f',  // 拉丁文扩展A：https://unicode-table.com/cn/blocks/latin-extended-a/
  '\u0180-\u024f',  // 拉丁文扩展B：https://unicode-table.com/cn/blocks/latin-extended-b/
  '\u0250-\u02af',  // 国际音标扩展：https://unicode-table.com/cn/blocks/ipa-extensions/
  '\u02b0-\u02ff',  // 占位修饰符号：https://unicode-table.com/cn/blocks/spacing-modifier-letters/
  '\u0300-\u036f',  // 结合附加符号：https://unicode-table.com/cn/blocks/combining-diacritical-marks/
  '\u0370-\u03ff',  // 希腊字母及科普特字母：https://unicode-table.com/cn/blocks/greek-coptic/
  '\u2000-\u206f',  // 常用标点：https://unicode-table.com/cn/blocks/general-punctuation/
  '\u2070-\u209f',  // 上标及下标：https://unicode-table.com/cn/blocks/superscripts-and-subscripts/
  '\u20a0-\u20cf',  // 货币符号：https://unicode-table.com/cn/blocks/currency-symbols/
  '\u20d0-\u20ff',  // 组合用记号：https://unicode-table.com/cn/blocks/combining-diacritical-marks-for-symbols/
  '\u2100-\u214f',  // 字母式符号：https://unicode-table.com/cn/blocks/letterlike-symbols/
  '\u2150-\u218f',  // 数字形式：https://unicode-table.com/cn/blocks/number-forms/
  '\u2190-\u21ff',  // 箭头：https://unicode-table.com/cn/blocks/arrows/
  '\u2200-\u22ff',  // 数学运算符：https://unicode-table.com/cn/blocks/mathematical-operators/
  '\u2460-\u24ff',  // 带圈或括号的字母数字：https://unicode-table.com/cn/blocks/enclosed-alphanumerics/
  '\u2500-\u257f',  // 制表符：https://unicode-table.com/cn/blocks/box-drawing/
  '\u2580-\u259f',  // 方块元素：https://unicode-table.com/cn/blocks/block-elements/
  '\u25a0-\u25ff',  // 几何图形：https://unicode-table.com/cn/blocks/geometric-shapes/
  '\u2600-\u26ff',  // 杂项符号：https://unicode-table.com/cn/blocks/miscellaneous-symbols/
  '\u2700-\u27bf',  // 印刷符号：https://unicode-table.com/cn/blocks/dingbats/
  '\u27c0-\u27ef',  // 杂项数学符号A：https://unicode-table.com/cn/blocks/miscellaneous-mathematical-symbols-a/
  '\u27f0-\u27ff',  // 追加箭头A：https://unicode-table.com/cn/blocks/suplemental-arrows-a/
  '\u2800-\u28ff',  // 盲文点字模型：https://unicode-table.com/cn/blocks/braille-patterns/
  '\u2900-\u297f',  // 追加箭头B：https://unicode-table.com/cn/blocks/suplemental-arrows-b/
  '\u2980—\u29ff',  // 杂项数学符号B：https://unicode-table.com/cn/blocks/miscellaneous-mathematical-symbols-b/
  '\u2a00-\u2aff',  // 追加数学运算符：https://unicode-table.com/cn/blocks/supplemental-mathematical-operators/
  '\u2b00-\u2bff',  // 杂项符号和箭头：https://unicode-table.com/cn/blocks/miscellaneous-symbols-and-arrows/
  '\u2c60-\u2c7f',  // 拉丁文扩展C：https://unicode-table.com/cn/blocks/latin-extended-c/
  '\u2e00-\u2e7f',  // 追加标点：https://unicode-table.com/cn/blocks/supplemental-punctuation/
  '\u2ff0-\u2fff',  // 表意文字描述符：https://unicode-table.com/cn/blocks/ideographic-description-characters/
  '\u3000-\u303f',  // 中日韩符号和标点：https://unicode-table.com/cn/blocks/cjk-symbols-and-punctuation/
  '\u3200-\u32ff',  // 带圈中日韩字母和月份：https://unicode-table.com/cn/blocks/enclosed-cjk-letters-and-months/
  '\ua720-\ua7ff',  // 拉丁文扩展D：https://unicode-table.com/cn/blocks/latin-extended-d/
  '\ufe10-\ufe1f',  // 竖排形式：https://unicode-table.com/cn/blocks/vertical-forms/
  '\ufe20-\ufe2f',  // 组合用半符号：https://unicode-table.com/cn/blocks/combining-half-marks/
  '\ufe50-\ufe6f',  // 小写变体形式：https://unicode-table.com/cn/blocks/small-form-variants/
  '\uff00-\uffef'   // 半角及全角形式：https://unicode-table.com/cn/blocks/halfwidth-and-fullwidth-forms/
];

const SKIP_CONTENTS_REGEX = eval('/^[' + SKIP_CONTENTS.join('') + ']+$/');

module.exports = SKIP_CONTENTS_REGEX;
