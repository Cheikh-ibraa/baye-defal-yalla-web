import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamensLaboratoireComponent } from './examens-laboratoire.component';

describe('ExamensLaboratoireComponent', () => {
  let component: ExamensLaboratoireComponent;
  let fixture: ComponentFixture<ExamensLaboratoireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamensLaboratoireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamensLaboratoireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
