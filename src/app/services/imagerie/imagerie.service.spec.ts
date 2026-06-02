import { TestBed } from '@angular/core/testing';

import { ImagerieService } from './imagerie.service';

describe('ImagerieService', () => {
  let service: ImagerieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImagerieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
