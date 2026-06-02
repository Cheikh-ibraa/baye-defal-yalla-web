import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacieDetailComponent } from './pharmacie-detail.component';

describe('PharmacieDetailComponent', () => {
  let component: PharmacieDetailComponent;
  let fixture: ComponentFixture<PharmacieDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacieDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PharmacieDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
