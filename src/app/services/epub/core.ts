/**
 * Core Utilities and Helpers
 * @module Core
*/

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
// const COMMENT_NODE = 8;
// const DOCUMENT_NODE = 9;

/**
 * Extend properties of an object
 * @param {object} target
 * @returns {object}
 * @memberof Core
 */
export function extend(target) {
  const sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    if (!source) {
      return;
    }
    Object.getOwnPropertyNames(source).forEach(function(propName) {
      Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
    });
  });
  return target;
}

/**
 * Fast quicksort insert for sorted array -- based on:
 *  http://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
 * @param {any} item
 * @param {array} array
 * @param {function} [compareFunction]
 * @returns {number} location (in array)
 * @memberof Core
 */
export function insert(item, array, compareFunction) {
  const location = locationOf(item, array, compareFunction, 0, array.length);
  array.splice(location, 0, item);

  return location;
}

/**
 * Finds where something would fit into a sorted array
 * @param {any} item
 * @param {array} array
 * @param {function} [compareFunction]
 * @param {function} [_start]
 * @param {function} [_end]
 * @returns {number} location (in array)
 * @memberof Core
 */
export function locationOf(item, array, compareFunction, _start, _end) {
  const start = _start || 0;
  const end = _end || array.length;
  const pivot = parseInt(start + (end - start) / 2, 10);

  if (!compareFunction) {
    compareFunction = function(a, b) {
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
      if (a === b) {
        return 0;
      }
    };
  }
  if (end - start <= 0) {
    return pivot;
  }

  const compared = compareFunction(array[pivot], item);
  if (end - start === 1) {
    return compared >= 0 ? pivot : pivot + 1;
  }
  if (compared === 0) {
    return pivot;
  }
  if (compared === -1) {
    return locationOf(item, array, compareFunction, pivot, end);
  } else {
    return locationOf(item, array, compareFunction, start, pivot);
  }
}

/**
 * Finds index of something in a sorted array
 * Returns -1 if not found
 * @param {any} item
 * @param {array} array
 * @param {function} [compareFunction]
 * @param {function} [_start]
 * @param {function} [_end]
 * @returns {number} index (in array) or -1
 * @memberof Core
 */
export function indexOfSorted(item, array, compareFunction, _start, _end) {
  const start = _start || 0;
  const end = _end || array.length;
  const pivot = parseInt(start + (end - start) / 2, 10);

  if (!compareFunction) {
    compareFunction = function(a, b) {
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
      if (a === b) {
        return 0;
      }
    };
  }
  if (end - start <= 0) {
    return -1; // Not found
  }

  const compared = compareFunction(array[pivot], item);
  if (end - start === 1) {
    return compared === 0 ? pivot : -1;
  }
  if (compared === 0) {
    return pivot; // Found
  }
  if (compared === -1) {
    return indexOfSorted(item, array, compareFunction, pivot, end);
  } else {
    return indexOfSorted(item, array, compareFunction, start, pivot);
  }
}

/**
 * Gets the index of a node in its parent
 * @private
 * @memberof Core
 */
export function indexOfNode(node, typeId) {
  const children = node.parentNode.childNodes;
  let index = -1;
  for (let i = 0; i < children.length; i++) {
    const sib = children[i];
    if (sib.nodeType === typeId) {
      index++;
    }
    if (sib === node) {
      break;
    }
  }
  return index;
}

/**
 * Gets the index of a text node in its parent
 * @param {node} textNode
 * @returns {number} index
 * @memberof Core
 */
export function indexOfTextNode(textNode) {
  return indexOfNode(textNode, TEXT_NODE);
}

/**
 * Gets the index of an element node in its parent
 * @param {element} elementNode
 * @returns {number} index
 * @memberof Core
 */
export function indexOfElementNode(elementNode) {
  return indexOfNode(elementNode, ELEMENT_NODE);
}

/**
 * Check if extension is xml
 * @param {string} ext
 * @returns {boolean}
 * @memberof Core
 */
export function isXml(ext) {
  return ['xml', 'opf', 'ncx'].indexOf(ext) > -1;
}

/**
 * Create a new blob
 * @param {any} content
 * @param {string} mime
 * @returns {Blob}
 * @memberof Core
 */
export function createBlob(content, mime) {
  return new Blob([content], {type : mime });
}

/**
 * Create a new base64 encoded url
 * @param {any} content
 * @param {string} mime
 * @returns {string} url
 * @memberof Core
 */
export function createBase64Url(content, mime) {
  if (typeof(content) !== 'string') {
    // Only handles strings
    return;
  }

  const data = btoa(encodeURIComponent(content));
  const datauri = 'data:' + mime + ';base64,' + data;
  return datauri;
}

/**
 * Get type of an object
 * @param {object} obj
 * @returns {string} type
 * @memberof Core
 */
export function type(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

/**
 * Parse xml (or html) markup
 * @param {string} markup
 * @param {string} mime
 * @param {boolean} forceXMLDom force using xmlDom to parse instead of native parser
 * @returns {document} document
 * @memberof Core
 */
export function parse(markup, mime, forceXMLDom) {
  let Parser;
  if (typeof DOMParser === 'undefined' || forceXMLDom) {
    Parser = (<any>window).require('xmldom').DOMParser;
  } else {
    Parser = DOMParser;
  }

  // Remove byte order mark before parsing
  // https://www.w3.org/International/questions/qa-byte-order-mark
  if (markup.charCodeAt(0) === 0xFEFF) {
    markup = markup.slice(1);
  }

  return new Parser().parseFromString(markup, mime);
}

/**
 * querySelector polyfill
 * @param {element} el
 * @param {string} sel selector string
 * @returns {element} element
 * @memberof Core
 */
export function qs(el, sel) {
  if (!el) {
    throw new Error('No Element Provided');
  }

  if (typeof el.querySelector !== 'undefined') {
    return el.querySelector(sel);
  } else {
    const elements = el.getElementsByTagName(sel);
    if (elements.length) {
      return elements[0];
    }
  }
}

/**
 * querySelectorAll polyfill
 * @param {element} el
 * @param {string} sel selector string
 * @returns {element[]} elements
 * @memberof Core
 */
export function qsa(el, sel) {

  if (typeof el.querySelector !== 'undefined') {
    return el.querySelectorAll(sel);
  } else {
    return el.getElementsByTagName(sel);
  }
}

/**
 * querySelector by property
 * @param {element} el
 * @param {string} sel selector string
 * @param {props[]} props
 * @returns {element[]} elements
 * @memberof Core
 */
export function qsp(el, sel, props) {
  if (typeof el.querySelector !== 'undefined') {
    sel += '[';
    for (const prop in props) {
      if (props.hasOwnProperty(prop)) {
        sel += prop + `~='` + props[prop] + `'`;
      }
    }
    sel += ']';
    return el.querySelector(sel);
  } else {
    const q = el.getElementsByTagName(sel);
    const filtered = Array.prototype.slice.call(q, 0).filter(function(ele) {
      for (const prop in props) {
        if (ele.getAttribute(prop) === props[prop]) {
          return true;
        }
      }
      return false;
    });

    if (filtered) {
      return filtered[0];
    }
  }
}

/**
 * Convert a blob to a base64 encoded string
 * @param {Blog} blob
 * @returns {string}
 * @memberof Core
 */
export function blob2base64(blob) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
      resolve(reader.result);
    };
  });
}

/**
 * querySelector with filter by epub type
 * @param {element} html
 * @param {string} element element type to find
 * @param {string} type epub type to find
 * @returns {element[]} elements
 * @memberof Core
 */
export function querySelectorByType(html, element, type){
  let query = null;
  if (typeof html.querySelector !== 'undefined') {
    query = html.querySelector(`${element}[*|type="${type}"]`);
  }
  // Handle IE not supporting namespaced epub:type in querySelector
  if (!query || query.length === 0) {
    query = qsa(html, element);
    for (let i = 0; i < query.length; i++) {
      if (query[i].getAttributeNS('http://www.idpf.org/2007/ops', 'type') === type ||
         query[i].getAttribute('epub:type') === type) {
        return query[i];
      }
    }
  } else {
    return query;
  }
}

/**
 * Find direct decendents of an element
 * @param {element} el
 * @returns {element[]} children
 * @memberof Core
 */
export function findChildren(el) {
  const result = [];
  const childNodes = el.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType === 1) {
      result.push(childNodes[i]);
    }
  }
  return result;
}

/**
 * Find all parents (ancestors) of an element
 * @param {element} node
 * @returns {element[]} parents
 * @memberof Core
 */
export function parents(node) {
  const nodes = [node];
  for (; node; node = node.parentNode) {
    nodes.unshift(node);
  }
  return nodes;
}

/**
 * Find all direct decendents of a specific type
 * @param {element} el
 * @param {string} nodeName
 * @param {boolean} [single]
 * @returns {element[]} children
 * @memberof Core
 */
export function filterChildren(el, nodeName, single) {
  const result = [];
  const childNodes = el.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    if (node.nodeType === 1 && node.nodeName.toLowerCase() === nodeName) {
      if (single) {
        return node;
      } else {
        result.push(node);
      }
    }
  }
  if (!single) {
    return result;
  }
}

/**
 * Filter all parents (ancestors) with tag name
 * @param {element} node
 * @param {string} tagname
 * @returns {element[]} parents
 * @memberof Core
 */
export function getParentByTagName(node, tagname) {
  let parent;
  if (node === null || tagname === '') {
    return;
  }
  parent = node.parentNode;
  while (parent.nodeType === 1) {
    if (parent.tagName.toLowerCase() === tagname) {
      return parent;
    }
    parent = parent.parentNode;
  }
}
