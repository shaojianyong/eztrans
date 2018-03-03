var ipc = require('electron').ipcRenderer;

var selectedNode = null;
var orgBackColor = null;

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

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (['script', 'pre', 'code', 'noscript'].indexOf(node.nodeName.toLowerCase()) === -1) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        seekNode(node.childNodes[i], seekObj);
      }
    }
  }
}

function scrollTo(nodeIndex) {
  var seekObj = {
    idx: 0,
    tgt: nodeIndex,
    obj: null
  };
  seekNode(document.body, seekObj);
  var eleParent = seekObj.obj.parentNode;
  while (eleParent.nodeType !== Node.ELEMENT_NODE) {
    eleParent = eleParent.parentNode;
  }

  if (window.$) {
    window.$('html, body').animate({
      scrollTop: eleParent.offsetTop + (document.body.clientHeight + eleParent.clientHeight) / 2
    }, 1000);
  } else {
    document.body.scrollTop = eleParent.offsetTop + (document.body.clientHeight + eleParent.clientHeight) / 2;
  }

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
