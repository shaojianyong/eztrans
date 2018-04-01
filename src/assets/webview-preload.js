var ipc = require('electron').ipcRenderer;

var SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];

var selectedNode = null;
var orgBackColor = null;


function matchMiniUnitPattern(node) {
  var hasTextChildNode = false;
  var hasThirdGenChild = false;
  for (var i = 0; i < node.childNodes.length; ++i) {
    const childNode = node.childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      if (childNode.nodeValue.trim()) {
        hasTextChildNode = true;
      }
    } else {
      if (childNode.childNodes.length > 1 || (childNode.childNodes.length
          && childNode.childNodes[0].nodeType !== Node.TEXT_NODE)) {
        hasThirdGenChild = true;
      }
    }
  }
  return (hasTextChildNode && !hasThirdGenChild);
}

function setNodeTexts(node, newData) {
  for (var i = 0; i < node.childNodes.length; ++i) {
    const childNode = node.childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      if (childNode.nodeValue.trim()) {
        childNode.nodeValue = newData.texts[newData.index];
        newData.index++;
      }
    } else {
      setNodeTexts(childNode, newData);
    }
  }
}

function nodeUpdate(node, newData) {
  if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
    if (matchMiniUnitPattern(node)) {
      setNodeTexts(node, newData);
    } else {
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
  if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
    if (matchMiniUnitPattern(node)) {
      if (seekObj.idx++ === seekObj.tgt) {
        seekObj.obj = node;
        return;
      }
      // seekObj.idx++;  WHY not working?
    } else {
      for (var i = 0; i < node.childNodes.length; ++i) {
        seekNode(node.childNodes[i], seekObj);
      }
    }
  }
}

function hitTest(node, hitObj) {
  if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
    if (matchMiniUnitPattern(node)) {
      if (hitObj.obj === node || hitObj.obj === node.parentNode) {
        hitObj.tgt = hitObj.idx;
        hitObj.mue = node;
        return;
      }
      hitObj.idx++;
    } else {
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
    obj: target,
    mue: null  // Mini-Unit Element
  };

  hitTest(document, hitObj);
  if (hitObj.tgt !== -1) {
    selectNode(hitObj.mue);
    ipc.sendToHost('hit-item', hitObj.tgt);
  }
});
