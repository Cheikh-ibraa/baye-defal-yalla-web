import { TestBed } from '@angular/core/testing';

import { LifestyleService } from './lifestyle.service';

describe('LifestyleService', () => {
  let service: LifestyleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LifestyleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
