import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostPanelComponent } from './host-panel.component';

describe('HostPanelComponent', () => {
  let component: HostPanelComponent;
  let fixture: ComponentFixture<HostPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HostPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
