import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaningsComponent } from './planings.component';

describe('PlaningsComponent', () => {
  let component: PlaningsComponent;
  let fixture: ComponentFixture<PlaningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaningsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
