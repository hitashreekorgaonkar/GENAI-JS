import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HiteshComponent } from './hitesh.component';

describe('HiteshComponent', () => {
  let component: HiteshComponent;
  let fixture: ComponentFixture<HiteshComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HiteshComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HiteshComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
