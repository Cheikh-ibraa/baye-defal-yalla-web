import { TestBed } from '@angular/core/testing';

import { DashboardMedService } from './dashboard-med.service';

describe('DashboardMedService', () => {
  let service: DashboardMedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardMedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
