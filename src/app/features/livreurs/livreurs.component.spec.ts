import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreursComponent } from './livreurs.component';

describe('LivreursComponent', () => {
  let component: LivreursComponent;
  let fixture: ComponentFixture<LivreursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivreursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivreursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
