// Type definitions for jQuery Highlight 3.4.0
// Project: https://github.com/knownasilya/jquery-highlight
// Definitions by: John Shao <https://github.com/shaojianyong>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

/// <reference types="jquery" />

interface JQuery {
  highlight(words: any, options?: any, callback?: any): JQuery;
  unhighlight(options?: any): JQuery;
}
