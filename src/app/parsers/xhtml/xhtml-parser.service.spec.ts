import { TestBed, inject } from '@angular/core/testing';

import { XhtmlParserService } from './xhtml-parser.service';

describe('XhtmlParserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [XhtmlParserService]
    });
  });

  it('should be created', inject([XhtmlParserService], (service: XhtmlParserService) => {
    expect(service).toBeTruthy();
  }));
});
