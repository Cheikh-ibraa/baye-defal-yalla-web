import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancePharmaciesComponent } from './finance-pharmacies.component';

describe('FinancePharmaciesComponent', () => {
  let component: FinancePharmaciesComponent;
  let fixture: ComponentFixture<FinancePharmaciesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancePharmaciesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancePharmaciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
