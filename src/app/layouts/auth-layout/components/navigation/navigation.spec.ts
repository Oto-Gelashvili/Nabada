import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Navigation } from './navigation';
import { RouterModule } from '@angular/router';

describe('Navigation', () => {
  let component: Navigation;
  let fixture: ComponentFixture<Navigation>;

  beforeEach(async () => {
    // mock document.fonts.ready since jsdom doesn't support it
    Object.defineProperty(document, 'fonts', {
      value: { ready: Promise.resolve() },
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [Navigation, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Navigation);
    component = fixture.componentInstance;

    // set up fake navRef BEFORE detectChanges so ngAfterViewInit uses it
    component.navRef = {
      nativeElement: {
        getBoundingClientRect: () => ({ left: 100, width: 400 }),
        querySelector: () => null,
      },
    } as any;

    fixture.detectChanges();

    await document.fonts.ready;

    (component as any).navRect = { left: 100, width: 400 };
  });

  it('moveBg sets position relative to nav left', () => {
    const mockEvent = {
      target: {
        getBoundingClientRect: () => ({ left: 150, width: 80 }),
      },
    } as unknown as MouseEvent;

    component.moveBg(mockEvent);

    // 150 - 100 = 50
    expect(component.bgElPosition()).toBe(50);
    expect(component.bgElWidth()).toBe(80);
  });

  it('bgReset sets position to 0 when no active link', () => {
    component.bgElPosition.set(99);
    component.bgElWidth.set(99);

    component.bgReset();

    expect(component.bgElPosition()).toBe(0);
    expect(component.bgElWidth()).toBe(0);
  });

  it('bgReset positions to active link when one exists', () => {
    component.navRef = {
      nativeElement: {
        getBoundingClientRect: () => ({ left: 100 }),
        querySelector: () => ({
          getBoundingClientRect: () => ({ left: 200, width: 60 }),
        }),
      },
    } as any;
    (component as any).navRect = { left: 100 };

    component.bgReset();

    // 200 - 100 = 100
    expect(component.bgElPosition()).toBe(100);
    expect(component.bgElWidth()).toBe(60);
  });

  it('logoReset sets position to 0 and width of homeLink', () => {
    component.navRef = {
      nativeElement: {
        querySelector: (selector: string) => {
          if (selector === '.homeLink') {
            return {
              getBoundingClientRect: () => ({ width: 90 }),
            };
          }
          return null;
        },
        getBoundingClientRect: () => ({ left: 100 }),
      },
    } as any;

    component.logoReset();

    expect(component.bgElPosition()).toBe(0);
    expect(component.bgElWidth()).toBe(90);
  });

  it('removes resize listener on destroy', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
