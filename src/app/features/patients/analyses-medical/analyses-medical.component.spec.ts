import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysesMedicalComponent } from './analyses-medical.component';

describe('AnalysesMedicalComponent', () => {
  let component: AnalysesMedicalComponent;
  let fixture: ComponentFixture<AnalysesMedicalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysesMedicalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalysesMedicalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
