import { TestBed, inject } from '@angular/core/testing';

import { ParserManagerService } from './parser-manager.service';

describe('EngineManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParserManagerService]
    });
  });

  it('should be created', inject([ParserManagerService], (service: ParserManagerService) => {
    expect(service).toBeTruthy();
  }));
});
