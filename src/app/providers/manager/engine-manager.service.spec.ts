import { TestBed, inject } from '@angular/core/testing';

import { EngineManagerService } from './engine-manager.service';

describe('EngineManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EngineManagerService]
    });
  });

  it('should be created', inject([EngineManagerService], (service: EngineManagerService) => {
    expect(service).toBeTruthy();
  }));
});
