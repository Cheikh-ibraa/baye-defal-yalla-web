import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientmanageComponent } from './patientmanage.component';

describe('PatientmanageComponent', () => {
  let component: PatientmanageComponent;
  let fixture: ComponentFixture<PatientmanageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientmanageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientmanageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
