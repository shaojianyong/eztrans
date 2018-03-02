const { ipcRenderer } = require('electron');

function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#27;')
    .replace(/\//g, '&#2f;');
}

function nodeUpdate(node, newData) {
  if (node.nodeType === Node.TEXT_NODE) {
    var trimmed = node.nodeValue.trim();
    if (trimmed) {
      var newVal = htmlEscape(newData.texts[newData.index]);
      if (newVal) {
        if (trimmed === node.nodeValue) {
          node.nodeValue = newVal;
        } else {
          node.nodeValue = node.nodeValue.replace(trimmed, newVal);
        }
      }
      newData.index++;
    }
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (['script', 'pre', 'code', 'noscript'].indexOf(node.nodeName.toLowerCase()) === -1) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        nodeUpdate(node.childNodes[i], newData);
      }
    }
  }
}

function htmlUpdate(data) {
  var newData = {
    texts: transData,
    index: 0
  };
  nodeUpdate(document.body, newData);
}

ipcRenderer.on('update-preview', function(event, message) {
  htmlUpdate(message);
});
