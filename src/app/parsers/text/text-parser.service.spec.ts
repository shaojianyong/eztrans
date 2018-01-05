import { TestBed, inject } from '@angular/core/testing';

import { TextParserService } from './text-parser.service';

describe('GoogleTranslateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TextParserService]
    });
  });

  it('should be created', inject([TextParserService], (service: TextParserService) => {
    expect(service).toBeTruthy();
  }));
});
