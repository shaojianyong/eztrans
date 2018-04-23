export class ParserUtils {
  static getHtmlNodeTexts(node: Node, nodeTexts: Array<string>, nodeTags: Array<string>): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();  // NO-BREAK SPACE (0x00a0) will be trimmed
      if (trimmed && trimmed !== String.fromCharCode(0x200b)) {  // ZERO WIDTH SPACE
        let nodeText = node.nodeValue;
        nodeText = nodeText.replace(/\r\n|\n/g, ' ');
        nodeText = nodeText.replace(/\s{2,}/g, ' ').trim();
        nodeTexts.push(nodeText);
        nodeTags.push(node.parentNode.nodeName.toLowerCase());
      }
      return;
    }

    for (let i = 0; i < node.childNodes.length; ++i) {
      ParserUtils.getHtmlNodeTexts(node.childNodes[i], nodeTexts, nodeTags);
    }
  }

  // stackoverflow.com/questions/32850812/node-xmldom-how-do-i-change-the-value-of-a-single-xml-field-in-javascript
  static setHtmlNodeTexts(node: Node, newData: any, xmldom = false): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();  // NO-BREAK SPACE (0x00a0) will be trimmed
      if (trimmed && trimmed !== String.fromCharCode(0x200b)) {  // ZERO WIDTH SPACE
        const newVal = newData.texts[newData.index];
        if (newVal && newVal.trim()) {
          if (xmldom) {
            (<any>node).data = newVal;  // stackoverflow:32850812
          } else {
            node.nodeValue = newVal;
          }
        }
        newData.index++;
      }
      return;
    }

    for (let i = 0; i < node.childNodes.length; ++i) {
      ParserUtils.setHtmlNodeTexts(node.childNodes[i], newData, xmldom);  // 不要漏掉参数xmldom！
    }
  }

  static testMiniTranslateUnit(node: Node): number {
    if (node.nodeType !== Node.DOCUMENT_NODE && !(node.textContent && node.textContent.trim())) {
      return 0;  // non translate-unit, no text node, no translate need
    }
    let hasTextChildNode = false;
    for (let i = 0; i < node.childNodes.length; ++i) {
      if (node.childNodes[i].nodeType === Node.TEXT_NODE && node.childNodes[i].nodeValue.trim()) {
        hasTextChildNode = true;
        break;
      }
    }
    return hasTextChildNode ? 1 : 2;  // 1-mini translate-unit 2-non-mini translate-unit
  }
}
