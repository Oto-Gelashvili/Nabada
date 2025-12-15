import { AfterViewInit, Component, ElementRef, ViewChild, OnDestroy, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [NgStyle, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements AfterViewInit, OnDestroy {
  @ViewChild('nav', { static: true }) navRef!: ElementRef<HTMLElement>;
  bgElPosition = signal(0);
  bgElWidth = signal(0);
  private navRect!: DOMRect;

  ngAfterViewInit() {
    // so what actually happes here is that yes DOM is ready, but external assets like ( styles, images, font families...) are not, in some cases accurately calculated
    // therefore we use load event and calculate rect after  all assets load
    window.addEventListener('load', this.initialSetup);
  }

  ngOnDestroy() {
    window.removeEventListener('load', this.initialSetup);
  }

  // lexicly binds "this" to header instance so we dont have to use explicit binding inside events
  private initialSetup = () => {
    this.navRect = this.navRef.nativeElement.getBoundingClientRect();
    this.bgReset();
  };
  moveBg(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const targetRect = target.getBoundingClientRect();

    this.bgElPosition.set(targetRect.left - this.navRect.left);
    this.bgElWidth.set(targetRect.width);
  }

  bgReset = () => {
    debugger;
    const activeLink = document.querySelector('.active') as HTMLElement;
    const activeLinkRect = activeLink?.getBoundingClientRect() as DOMRect;
    this.bgElPosition.set(activeLinkRect.left - this.navRect.left);
    this.bgElWidth.set(activeLinkRect.width);
  };
}
