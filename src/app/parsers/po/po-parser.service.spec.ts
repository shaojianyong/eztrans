import { TestBed, inject } from '@angular/core/testing';

import { PoParserService } from './po-parser.service';

describe('PoParserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoParserService]
    });
  });

  it('should be created', inject([PoParserService], (service: PoParserService) => {
    expect(service).toBeTruthy();
  }));
});
