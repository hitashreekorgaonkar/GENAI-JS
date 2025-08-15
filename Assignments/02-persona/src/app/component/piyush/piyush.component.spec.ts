import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PiyushComponent } from './piyush.component';

describe('PiyushComponent', () => {
  let component: PiyushComponent;
  let fixture: ComponentFixture<PiyushComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PiyushComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PiyushComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
