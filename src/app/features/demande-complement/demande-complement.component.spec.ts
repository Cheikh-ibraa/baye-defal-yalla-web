import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeComplementComponent } from './demande-complement.component';

describe('DemandeComplementComponent', () => {
  let component: DemandeComplementComponent;
  let fixture: ComponentFixture<DemandeComplementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandeComplementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemandeComplementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
