import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoAsistente } from './evento-asistente';

describe('EventoAsistente', () => {
  let component: EventoAsistente;
  let fixture: ComponentFixture<EventoAsistente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoAsistente],
    }).compileComponents();

    fixture = TestBed.createComponent(EventoAsistente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
