import { TestBed } from '@angular/core/testing';

import { DashboardImagerieService } from './dashboard-imagerie.service';

describe('DashboardImagerieService', () => {
  let service: DashboardImagerieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardImagerieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
