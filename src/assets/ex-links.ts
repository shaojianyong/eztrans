const {shell} = (<any>window).require('electron');

export class ExLinksModule {

   static applyExLinks(): void {
    const links = document.querySelectorAll('a[href]');
    for (let i = 0; i < links.length; i++) {
      const link = links.item(i);
      const url = link.getAttribute('href');
      if (url.indexOf('http') === 0) {
        link.addEventListener('click', e => {
          console.log(url);
          e.preventDefault();
          shell.openExternal(url);
        });
      }
    }
  }

}
