import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardImagerieComponent } from './dashboard-imagerie.component';

describe('DashboardImagerieComponent', () => {
  let component: DashboardImagerieComponent;
  let fixture: ComponentFixture<DashboardImagerieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardImagerieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardImagerieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
