const SKIP_CONTENTS = [
  '\u0001-\u0040',  // 01-1f控制字符; 20-2f符号(空格-斜杠); 30-39数字(0-9); 3a-40符号(冒号-电子邮件符号)
  '\u005b-\u0060',  // 开方括号-开单引号
  '\u007b-\u007f',  // 开花括号-删除
  '\u0080-\u00ff',  // 拉丁文补充1：https://unicode-table.com/cn/blocks/latin-1-supplement/
  '\u0100-\u017f',  // 拉丁文扩展A


  '\u25b2\u25ba\u25bc\u25c4\u2794\u2799\u279c',  // 箭头符号(1)
  '\u279e-\u27a0',  // 箭头符号(2)
  '\u27a4-\u27a8\u27b2\u27b3\u27b5\u27b8\u27ba',  // 箭头符号(3)
  '\u27bc-\u27be\u25a3\u25c6\u25c8',  // 箭头符号(4)
  '\u2600-\u2603\u2605\u260e\u260f\u2618\u2620',  // 基本形状(1)
  '\u2622-\u2625\u262a\u262e\u262f',  // 基本形状(2)
  '\u2638-\u263b\u267b\u267f\u2693\u26a0\u26a1\u2702\u2704\u2706\u2708\u2709\u2726',  // 基本形状(3)
  '\u273f-\u2742\u2744\u2748\u2764\u2766\u9749\ufffd',  // 基本形状(4)
  '\u00a2-\u00a5',  // 货币符号
  '\u00bc-\u00be\u2030\u2053\u2054',  // 数字类(1)
  '\u205b-\u205d',  // 数字类(2)
  '\u2669-\u266f',  // 音乐符号



  '\u2000-\u206f',  // 常用标点：https://unicode-table.com/cn/blocks/general-punctuation/
  '\u20a0-\u20cf',  // 货币符号：https://unicode-table.com/cn/blocks/currency-symbols/
  '\u2100-\u214f',  // 字母式符号：https://unicode-table.com/cn/blocks/letterlike-symbols/
  '\u2150-\u218f',  // 数字形式：https://unicode-table.com/cn/blocks/number-forms/
  '\u2190-\u21ff',  // 箭头：https://unicode-table.com/cn/blocks/arrows/
  '\u2200-\u22ff',  // 数学运算符：https://unicode-table.com/cn/blocks/mathematical-operators/
  '\u2460-\u24ff',  // 带圈或括号的字母数字：https://unicode-table.com/cn/blocks/enclosed-alphanumerics/
  '\u27f0-\u27ff',  // 追加箭头A：https://unicode-table.com/cn/blocks/suplemental-arrows-a/
  '\u2900-\u297f',  // 追加箭头B：https://unicode-table.com/cn/blocks/suplemental-arrows-b/
  '\u200b'  // ZERO WIDTH SPACE
];

const SKIP_CONTENTS_REGEX = eval('/^[' + SKIP_CONTENTS.join('') + ']+$/');

module.exports = SKIP_CONTENTS_REGEX;
