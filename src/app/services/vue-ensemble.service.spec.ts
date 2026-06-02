import { TestBed } from '@angular/core/testing';

import { VueEnsembleService } from './vue-ensemble.service';

describe('VueEnsembleService', () => {
  let service: VueEnsembleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VueEnsembleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
