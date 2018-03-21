import {qs, qsa, querySelectorByType, filterChildren, getParentByTagName} from './core';

/**
 * Navigation Parser
 * @param {document} xml navigation html / xhtml / ncx
 */
class Navigation {
  toc = [];
  tocByHref = {};
  tocById = {};
  landmarks = [];
  landmarksByType = {};
  length = 0;

  constructor(xml) {
    this.toc = [];
    this.tocByHref = {};
    this.tocById = {};

    this.landmarks = [];
    this.landmarksByType = {};

    this.length = 0;
    if (xml) {
      this.parse(xml);
    }
  }

  /**
   * Parse out the navigation items
   * @param {document} xml navigation html / xhtml / ncx
   */
  parse(xml) {
    let html = null;
    let ncx = null;
    const isXml = xml.nodeType;
    if (isXml) {
      html = qs(xml, 'html');
      ncx = qs(xml, 'ncx');
    }

    if (!isXml) {
      this.toc = this.load(xml);
    } else if (html) {
      this.toc = this.parseNav(xml);
      this.landmarks = this.parseLandmarks(xml);
    } else if (ncx) {
      this.toc = this.parseNcx(xml);
    }
    this.length = 0;
    this.unpack(this.toc);
  }

  /**
   * Unpack navigation items
   * @private
   * @param  {array} toc
   */
  unpack(toc) {
    for (let i = 0; i < toc.length; i++) {
      const item = toc[i];
      if (item.href) {
        this.tocByHref[item.href] = i;
      }
      if (item.id) {
        this.tocById[item.id] = i;
      }
      this.length++;
      if (item.subitems.length) {
        this.unpack(item.subitems);
      }
    }
  }

  /**
   * Get an item from the navigation
   * @param  {string} target
   * @return {object} navItems
   */
  get(target) {
    let res = this.toc;
    if (target) {
      let index = 0;
      if (target.indexOf('#') === 0) {
        index = this.tocById[target.substring(1)];
      } else if (target in this.tocByHref) {
        index = this.tocByHref[target];
      }
      res = this.toc[index];
    }
    return res;
  }

  /**
   * Get a landmark by type
   * List of types: https://idpf.github.io/epub-vocabs/structure/
   * @param  {string} type
   * @return {object} landmarkItems
   */
  landmark(type) {
    let res = this.landmarks;
    if (type) {
      const index = this.landmarksByType[type];
      res = this.landmarks[index];
    }
    return res;
  }

  /**
   * Parse toc from a Epub > 3.0 Nav
   * @private
   * @param  {document} navHtml
   * @return {array} navigation list
   */
  parseNav(navHtml) {
    const toc = {};
    const list = [];

    const navElement = querySelectorByType(navHtml, 'nav', 'toc');
    const navItems = navElement ? qsa(navElement, 'li') : [];
    if (!navItems || navItems.length === 0) {
      return list;
    }

    for (let i = 0; i < navItems.length; ++i) {
      const item = this.navItem(navItems[i]);
      if (item) {
        toc[item.id] = item;
        if (!item.parent) {
          list.push(item);
        } else {
          const parent = toc[item.parent];
          parent.subitems.push(item);
        }
      }
    }

    return list;
  }

  /**
   * Create a navItem
   * @private
   * @param  {element} item
   * @return {object} navItem
   */
  navItem(item) {
    const content = filterChildren(item, 'a', true);
    if (!content) {
      return null;
    }

    let parent = null;
    let parentItem = getParentByTagName(item, 'li');
    if (parentItem) {
      parent = parentItem.getAttribute('id');
    }

    while (!parent && parentItem) {
      parentItem = getParentByTagName(parentItem, 'li');
      if (parentItem) {
        parent = parentItem.getAttribute('id');
      }
    }

    return {
      id: item.getAttribute('id') || undefined,
      href: content.getAttribute('href') || '',
      label: content.textContent || '',
      subitems: [],
      parent: parent
    };
  }

  /**
   * Parse landmarks from a Epub > 3.0 Nav
   * @private
   * @param  {document} navHtml
   * @return {array} landmarks list
   */
  parseLandmarks(navHtml) {
    const list = [];
    const navElement = querySelectorByType(navHtml, 'nav', 'landmarks');
    const navItems = navElement ? qsa(navElement, 'li') : [];

    if (!navItems || navItems.length === 0) {
      return list;
    }

    for (let i = 0; i < navItems.length; ++i) {
      const item = this.landmarkItem(navItems[i]);
      if (item) {
        list.push(item);
        this.landmarksByType[item.type] = i;
      }
    }
    return list;
  }

  /**
   * Create a landmarkItem
   * @private
   * @param  {element} item
   * @return {object} landmarkItem
   */
  landmarkItem(item) {
    let res = null;
    const content = filterChildren(item, 'a', true);
    if (content) {
      res = {
        href: content.getAttribute('href') || '',
        label: content.textContent || '',
        type : content.getAttributeNS('http://www.idpf.org/2007/ops', 'type') || undefined
      };
    }
    return res;
  }

  /**
   * Parse from a Epub > 3.0 NC
   * @private
   * @param  {document} navHtml
   * @return {array} navigation list
   */
  parseNcx(tocXml) {
    const toc = {};
    const list = [];

    const navPoints = qsa(tocXml, 'navPoint');
    const length = navPoints.length;
    if (!navPoints || length === 0) {
      return list;
    }

    for (let i = 0; i < length; ++i) {
      const item = this.ncxItem(navPoints[i]);
      toc[item.id] = item;
      if (!item.parent) {
        list.push(item);
      } else {
        const parent = toc[item.parent];
        parent.subitems.push(item);
      }
    }
    return list;
  }

  /**
   * Create a ncxItem
   * @private
   * @param  {element} item
   * @return {object} ncxItem
   */
  ncxItem(item) {
    const content = qs(item, 'content');
    const navLabel = qs(item, 'navLabel');

    let parent = null;
    const parentNode = item.parentNode;
    if (parentNode && parentNode.nodeName === 'navPoint') {
      parent = parentNode.getAttribute('id');
    }

    return {
      id: item.getAttribute('id') || false,
      href: content.getAttribute('src'),
      label: navLabel.textContent ? navLabel.textContent : '',
      'subitems': [],
      'parent': parent
    };
  }

  /**
   * Load Spine Items
   * @param  {object} json the items to be loaded
   */
  load(json) {
    return json.map((item) => {
      item.label = item.title;
      if (item.children) {
        item.subitems = this.load(item.children);
      }
      return item;
    });
  }

  /**
   * forEach pass through
   * @param  {Function} fn function to run on each item
   * @return {method} forEach loop
   */
  forEach(fn) {
    return this.toc.forEach(fn);
  }
}

export default Navigation;
