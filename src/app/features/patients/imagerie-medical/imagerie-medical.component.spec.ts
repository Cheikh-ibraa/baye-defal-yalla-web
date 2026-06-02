import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagerieMedicalComponent } from './imagerie-medical.component';

describe('ImagerieMedicalComponent', () => {
  let component: ImagerieMedicalComponent;
  let fixture: ComponentFixture<ImagerieMedicalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagerieMedicalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagerieMedicalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
