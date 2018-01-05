import { TestBed, inject } from '@angular/core/testing';

import { HtmlParserService } from './html-parser.service';

describe('GoogleTranslateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HtmlParserService]
    });
  });

  it('should be created', inject([HtmlParserService], (service: HtmlParserService) => {
    expect(service).toBeTruthy();
  }));
});
