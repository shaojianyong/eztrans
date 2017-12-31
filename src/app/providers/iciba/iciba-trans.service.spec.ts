import { TestBed, inject } from '@angular/core/testing';

import { IcibaTransService } from './iciba-trans.service';

describe('BaiduVipfyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IcibaTransService]
    });
  });

  it('should be created', inject([IcibaTransService], (service: IcibaTransService) => {
    expect(service).toBeTruthy();
  }));
});
