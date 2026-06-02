import { TestBed } from '@angular/core/testing';

import { DashboardLaboratoireService } from './dashboard-laboratoire.service';

describe('DashboardLaboratoireService', () => {
  let service: DashboardLaboratoireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardLaboratoireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
