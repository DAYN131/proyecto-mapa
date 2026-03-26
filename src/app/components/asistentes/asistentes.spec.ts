import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asistentes } from './asistentes';

describe('Asistentes', () => {
  let component: Asistentes;
  let fixture: ComponentFixture<Asistentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asistentes],
    }).compileComponents();

    fixture = TestBed.createComponent(Asistentes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
