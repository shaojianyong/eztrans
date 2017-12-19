import { TestBed, inject } from '@angular/core/testing';

import { GoogleTranslateService } from './translate.service';

describe('GoogleTranslateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GoogleTranslateService]
    });
  });

  it('should be created', inject([GoogleTranslateService], (service: GoogleTranslateService) => {
    expect(service).toBeTruthy();
  }));
});
