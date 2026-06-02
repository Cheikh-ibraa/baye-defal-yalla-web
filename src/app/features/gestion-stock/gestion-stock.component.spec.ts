import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionStockComponent } from './gestion-stock.component';

describe('GestionStockComponent', () => {
  let component: GestionStockComponent;
  let fixture: ComponentFixture<GestionStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
