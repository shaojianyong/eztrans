var ipc = require('electron').ipcRenderer;

var SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];

var selectedNode = null;
var orgBackColor = null;


function nodeUpdate(node, newData) {
  if (node.nodeType === Node.TEXT_NODE) {
    var trimmed = node.nodeValue.trim();
    if (trimmed) {
      var newVal = newData.texts[newData.index];
      if (newVal !== null) {
        node.nodeValue = node.nodeValue.replace(trimmed, newVal.trim());  // 保留首尾空白字符
      }
      newData.index++;
    }
  }

  if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
    if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
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
  nodeUpdate(document, newData);
}

function seekNode(node, seekObj) {
  if (node.nodeType === Node.TEXT_NODE) {
    var trimmed = node.nodeValue.trim();
    if (trimmed) {
      if (seekObj.idx++ === seekObj.tgt) {
        seekObj.obj = node;
        return;
      }
    }
  }

  if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
    if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        seekNode(node.childNodes[i], seekObj);
      }
    }
  }
}

function hitTest(node, hitObj) {
  if (node.nodeType === Node.TEXT_NODE) {
    var trimmed = node.nodeValue.trim();
    if (trimmed) {
      if (hitObj.obj === node || hitObj.obj === node.parentNode) {
        hitObj.tgt = hitObj.idx;
        return;
      }
      hitObj.idx++;
    }
  }

  if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
    if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        hitTest(node.childNodes[i], hitObj);
      }
    }
  }
}

function selectNode(eleParent) {
  if (eleParent !== selectedNode) {
    var oldBackColor = eleParent.style.backgroundColor;
    eleParent.style.backgroundColor = '#e0e0e7';
    if (selectedNode) {
      selectedNode.style.backgroundColor = orgBackColor;
    }
    orgBackColor = oldBackColor;
    selectedNode = eleParent;
  }
}

function scrollTo(nodeIndex) {
  var seekObj = {
    idx: 0,
    tgt: nodeIndex,
    obj: null
  };
  seekNode(document, seekObj);
  var eleNode = seekObj.obj;
  while (eleNode.nodeType !== Node.ELEMENT_NODE) {
    eleNode = eleNode.parentNode;
  }

  // stackoverflow.com/questions/178325/how-do-i-check-if-an-element-is-hidden-in-jquery
  if ($(eleNode).is(":visible")) {
    window.$('html, body').animate({
      scrollTop: $(eleNode).offset().top - (document.body.clientHeight - eleNode.clientHeight) / 2  // 绝对(相对页面的)偏移量
    }, 200);
    selectNode(eleNode);
  }
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

ipc.on('update-preview', function(event, message) {
  htmlUpdate(message);
});

ipc.on('scroll-to', function(event, message) {
  scrollTo(message);
});

document.addEventListener('DOMContentLoaded', function () {
  window.$ = window.jQuery = require('../assets/jquery-3.2.1.min');

  disableLinks();
});

document.addEventListener('click', function (event) {
  // stackoverflow.com/questions/9012537/how-to-get-the-element-clicked-for-the-whole-document
  event = event || window.event;
  var target = event.target || event.srcElement;

  var hitObj = {
    idx: 0,
    tgt: -1,
    obj: target
  };
  hitTest(document, hitObj);

  if (hitObj.tgt !== -1) {
    var eleNode = hitObj.obj;
    while (eleNode.nodeType !== Node.ELEMENT_NODE) {
      eleNode = eleNode.parentNode;
    }
    selectNode(eleNode);
    ipc.sendToHost('hit-item', hitObj.tgt);
  }
});
