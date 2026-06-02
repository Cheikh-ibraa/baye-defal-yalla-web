import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementsHelpComponent } from './paiements-help.component';

describe('PaiementsHelpComponent', () => {
  let component: PaiementsHelpComponent;
  let fixture: ComponentFixture<PaiementsHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementsHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaiementsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
