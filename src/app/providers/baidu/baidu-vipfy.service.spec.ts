import { TestBed, inject } from '@angular/core/testing';

import { BaiduVipfyService } from './baidu-vipfy.service';

describe('BaiduVipfyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaiduVipfyService]
    });
  });

  it('should be created', inject([BaiduVipfyService], (service: BaiduVipfyService) => {
    expect(service).toBeTruthy();
  }));
});
