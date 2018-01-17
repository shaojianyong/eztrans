// Type definitions for jQuery Highlight 3.4.0
// Project: https://github.com/knownasilya/jquery-highlight
// Definitions by: John Shao <https://github.com/shaojianyong>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

/// <reference types="jquery" />

interface JQueryHighlightOptions {
  className?: string;  // default: .highlight
  element?: string;    // default: span
  caseSensitive?: boolean;  // default: false
  wordsOnly?: boolean;      // default: false
  wordsBoundary?: string;   // default: \b
  wordsBoundaryStart?: string;
  wordsBoundaryEnd?: string;
}

interface JQueryUnhighlightOptions {
  className?: string;  // default: .highlight
  element?: string;    // default: span
}

interface JQuery {
  highlight(words: string|Array<string>): JQuery;
  highlight(words: string|Array<string>, JQueryHighlightOptions): JQuery;
  highlight(words: string|Array<string>, JQueryHighlightOptions, callback: (el)=>void): JQuery;

  unhighlight(): JQuery;
  unhighlight(options: JQueryUnhighlightOptions): JQuery;
}
