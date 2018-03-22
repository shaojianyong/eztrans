import {parse} from './core';
import Container from './container';
import Packaging from './packaging';
import Navigation from './navigation';

class Epub {
  container = null;
  packaging = null;
  navigation = null;

  loadContainer(containerData) {
    const xmlDoc = parse(containerData, 'text/xml', false);
    this.container = new Container();
    this.container.parse(xmlDoc);
  }

  loadPackaging(opfData) {
    const opfDoc = parse(opfData, this.container.opfMimeType, true);
    this.packaging = new Packaging();
    this.packaging.parse(opfDoc);
  }

  loadNavigation(ncxData) {
    const mimeType = this.packaging.ncxPath ? 'application/x-dtbncx+xml' : 'application/xhtml+xml';
    const ncxDoc = parse(ncxData, mimeType, true);
    this.navigation = new Navigation();
    this.navigation.parse(ncxDoc);
  }

}

export default Epub;
