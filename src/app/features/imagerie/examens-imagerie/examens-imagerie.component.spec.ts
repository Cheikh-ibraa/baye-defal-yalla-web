import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamensImagerieComponent } from './examens-imagerie.component';

describe('ExamensImagerieComponent', () => {
  let component: ExamensImagerieComponent;
  let fixture: ComponentFixture<ExamensImagerieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamensImagerieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamensImagerieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
