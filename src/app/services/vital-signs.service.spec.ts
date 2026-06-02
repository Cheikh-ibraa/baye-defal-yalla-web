import { TestBed } from '@angular/core/testing';

import { VitalSignsService } from './vital-signs.service';

describe('VitalSignsService', () => {
  let service: VitalSignsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VitalSignsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
