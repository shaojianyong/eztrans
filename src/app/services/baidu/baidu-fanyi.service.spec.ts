import { TestBed, inject } from '@angular/core/testing';

import { BaiduFanyiService } from './baidu-fanyi.service';

describe('BaiduFanyiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaiduFanyiService]
    });
  });

  it('should be created', inject([BaiduFanyiService], (service: BaiduFanyiService) => {
    expect(service).toBeTruthy();
  }));
});
