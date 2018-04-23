var ipc = require('electron').ipcRenderer;

var SKIP_ELEMENTS = require('../assets/skip_elements');

var selectedNode = null;
var orgBackColor = null;

function testMiniTranslateUnit(node) {
  if (node.nodeType !== Node.DOCUMENT_NODE && !(node.textContent && node.textContent.trim())) {
    return 0;  // non translate-unit, no text node, no translate need
  }
  var hasTextChildNode = false;
  for (var i = 0; i < node.childNodes.length; ++i) {
    if (node.childNodes[i].nodeType === Node.TEXT_NODE && node.childNodes[i].nodeValue.trim()) {
      hasTextChildNode = true;
      break;
    }
  }
  return hasTextChildNode ? 1 : 2;  // 1-mini translate-unit 2-non-mini translate-unit
}

function getNodeTexts(node, nodeTexts) {
  if (node.nodeType === Node.TEXT_NODE) {
    const trimmed = node.nodeValue.trim();  // NO-BREAK SPACE (0x00a0) will be trimmed
    if (trimmed && !trimmed.match(/^[\u0001-\u0040\u005b-\u0060\u007b-\u007f\u2654-\u265F\u2660-\u2667\u200b]+$/)) {
      nodeTexts.push(node.nodeValue);
    }
    return;
  }

  for (var i = 0; i < node.childNodes.length; ++i) {
    getNodeTexts(node.childNodes[i], nodeTexts);
  }
}

function setNodeTexts(node, newData) {
  if (node.nodeType === Node.TEXT_NODE) {
    const trimmed = node.nodeValue.trim();  // NO-BREAK SPACE (0x00a0) will be trimmed
    if (trimmed && !trimmed.match(/^[\u0001-\u0040\u005b-\u0060\u007b-\u007f\u200b]+$/)) {
      const newVal = newData.texts[newData.index];
      if (newVal && newVal.trim()) {
        node.nodeValue = newVal;
      }
      newData.index++;
    }
    return;
  }

  for (var i = 0; i < node.childNodes.length; ++i) {
    setNodeTexts(node.childNodes[i], newData);
  }
}

function nodeUpdate(node, newData) {
  if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
    && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
    const testRes = testMiniTranslateUnit(node);
    if (testRes === 1) {
      const source = [];
      getNodeTexts(node, source);
      if (source.length) {
        setNodeTexts(node, newData);
      }
    } else if (testRes === 2) {
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
  if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
    && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
    const testRes = testMiniTranslateUnit(node);
    if (testRes === 1) {
      const source = [];
      getNodeTexts(node, source);
      if (source.length) {
        if (seekObj.idx++ === seekObj.tgt) {
          seekObj.obj = node;
          return;
        }
        // seekObj.idx++;  WHY not working?
      }
    } else if (testRes === 2) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        seekNode(node.childNodes[i], seekObj);
      }
    }
  }
}

function hitTest(node, hitObj) {
  if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
    && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
    const testRes = testMiniTranslateUnit(node);
    if (testRes === 1) {
      const source = [];
      getNodeTexts(node, source);
      if (source.length) {
        var hitMtu = false;
        var eleObj = hitObj.obj;
        while (eleObj) {
          if (eleObj === node) {
            hitMtu = true;
            break;
          }
          eleObj = eleObj.parentNode;
        }

        if (hitMtu) {
          hitObj.tgt = hitObj.idx;
          hitObj.mue = node;
          return;
        }
        hitObj.idx++;
      }
    } else if (testRes === 2) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        hitTest(node.childNodes[i], hitObj);
      }
    }
  }
}

function selectNode(eleNode) {
  if (eleNode !== selectedNode) {
    var oldBackColor = eleNode.style.backgroundColor;
    eleNode.style.backgroundColor = '#e8e8e8';
    if (selectedNode) {
      selectedNode.style.backgroundColor = orgBackColor;
    }
    orgBackColor = oldBackColor;
    selectedNode = eleNode;
  }
}

function scrollTo(nodeIndex) {
  var seekObj = {
    idx: 0,
    tgt: nodeIndex,
    obj: null
  };
  seekNode(document, seekObj);
  // stackoverflow.com/questions/178325/how-do-i-check-if-an-element-is-hidden-in-jquery
  if ($(seekObj.obj).is(":visible")) {
    window.$('html, body').animate({
      scrollTop: $(seekObj.obj).offset().top - (document.body.clientHeight - seekObj.obj.clientHeight) / 2  // 绝对(相对页面的)偏移量
    }, 200);
    selectNode(seekObj.obj);
  }
}

function disableLinks() {
  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    links.item(i).addEventListener('click', function (e) {
      e.preventDefault();
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
    obj: target,
    mue: null  // Mini-Unit Element
  };

  hitTest(document, hitObj);
  if (hitObj.tgt !== -1) {
    selectNode(hitObj.mue);
    ipc.sendToHost('hit-item', hitObj.tgt);
  }
});
