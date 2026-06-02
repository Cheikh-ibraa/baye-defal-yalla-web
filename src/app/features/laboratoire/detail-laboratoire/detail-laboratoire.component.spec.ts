import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailLaboratoireComponent } from './detail-laboratoire.component';

describe('DetailLaboratoireComponent', () => {
  let component: DetailLaboratoireComponent;
  let fixture: ComponentFixture<DetailLaboratoireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailLaboratoireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailLaboratoireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
