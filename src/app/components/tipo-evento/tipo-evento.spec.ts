import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoEvento } from './tipo-evento';

describe('TipoEvento', () => {
  let component: TipoEvento;
  let fixture: ComponentFixture<TipoEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoEvento],
    }).compileComponents();

    fixture = TestBed.createComponent(TipoEvento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
