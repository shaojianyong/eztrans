import { TestBed, inject } from '@angular/core/testing';

import { HtmlParserService } from './html-parser.service';

describe('HtmlParserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HtmlParserService]
    });
  });

  it('should be created', inject([HtmlParserService], (service: HtmlParserService) => {
    expect(service).toBeTruthy();
  }));
});
