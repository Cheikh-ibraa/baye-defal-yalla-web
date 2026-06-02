import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificatMedicalComponent } from './certificat-medical.component';

describe('CertificatMedicalComponent', () => {
  let component: CertificatMedicalComponent;
  let fixture: ComponentFixture<CertificatMedicalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificatMedicalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificatMedicalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
