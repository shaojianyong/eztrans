import {qs} from './core';

/**
 * Handles Parsing and Accessing an Epub Container
 * @class
 * @param {document} [containerDocument] xml document
 */
class Container {
  packagePath = '';
  opfMimeType = '';
  encoding = '';

  constructor() {
    this.packagePath = '';
    this.opfMimeType = '';
    this.encoding = '';
  }

  /**
   * Parse the Container XML
   * @param  {document} containerDocument
   * <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
   */
  parse(containerDocument) {
    if (!containerDocument) {
      throw new Error('Container File Not Found');
    }

    const rootfile = qs(containerDocument, 'rootfile');
    if (!rootfile) {
      throw new Error('No RootFile Found');
    }

    this.packagePath = rootfile.getAttribute('full-path');
    this.opfMimeType = rootfile.getAttribute('media-type');
    this.encoding = containerDocument.xmlEncoding;
  }

  destroy() {
    this.packagePath = undefined;
    this.opfMimeType = undefined;
    this.encoding = undefined;
  }
}

export default Container;
