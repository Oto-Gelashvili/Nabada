import { NgStyle } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DOCUMENT,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [NgStyle, RouterLinkActive, RouterLink],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation implements AfterViewInit, OnDestroy {
  @ViewChild('nav', { static: false }) navRef!: ElementRef<HTMLElement>;
  readonly bgElPosition = signal(0);
  readonly bgElWidth = signal(0);
  private navRect!: DOMRect;
  private document = inject(DOCUMENT);
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit() {
    // so what actually happes here is that yes DOM is ready, but external assets like ( styles, images, font families...) are not
    // therefore we use API to run function afrer fonts are loaded

    this.document.fonts.ready.then(() => {
      this.initialSetup();

      //we listen to resize event so navRect gets coreccly recalculated on screen size change
      window.addEventListener('resize', this.initialSetup);
    });
  }
  ngOnDestroy() {
    window.removeEventListener('resize', this.initialSetup);
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
    const activeLink = this.navRef.nativeElement.querySelector<HTMLElement>('.active');
    if (!activeLink || !this.navRect) return;
    const activeLinkRect = activeLink.getBoundingClientRect();
    this.bgElPosition.set(activeLinkRect.left - this.navRect.left);
    this.bgElWidth.set(activeLinkRect.width);
  };
  logoReset = () => {
    const homeLink = this.document.querySelector<HTMLElement>('.homeLink');
    if (homeLink) {
      const heomLinkWidth = homeLink.getBoundingClientRect().width;
      this.bgElPosition.set(0);
      this.bgElWidth.set(heomLinkWidth);
    }
  };
}
