import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailExamenImagerieComponent } from './detail-examen-imagerie.component';

describe('DetailExamenImagerieComponent', () => {
  let component: DetailExamenImagerieComponent;
  let fixture: ComponentFixture<DetailExamenImagerieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailExamenImagerieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailExamenImagerieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
