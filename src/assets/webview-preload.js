const { ipcRenderer } = require('electron');

function nodeUpdate(node, newData) {
  if (node.nodeType === Node.TEXT_NODE) {
    var trimmed = node.nodeValue.trim();
    if (trimmed) {
      var newVal = newData.texts[newData.index];
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

function htmlUpdate(transData) {
  var newData = {
    texts: transData,
    index: 0
  };
  nodeUpdate(document.body, newData);
}

function disableLinks() {
  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    links.item(i).addEventListener('click', function (e) {
      e.preventDefault();
      // shell.openExternal(url);
    });
  }
}

ipcRenderer.on('update-preview', function(event, message) {
  htmlUpdate(message);
});

document.addEventListener('DOMContentLoaded', function () {
  disableLinks();
});
