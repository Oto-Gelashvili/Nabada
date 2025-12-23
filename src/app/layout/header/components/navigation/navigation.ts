import { NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, signal, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [NgStyle, RouterLinkActive, RouterLink],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation implements AfterViewInit, OnDestroy {
  @ViewChild('nav', { static: false }) navRef!: ElementRef<HTMLElement>;
  bgElPosition = signal(0);
  bgElWidth = signal(0);
  private navRect!: DOMRect;

  ngAfterViewInit() {
    // so what actually happes here is that yes DOM is ready, but external assets like ( styles, images, font families...) are not, in some cases accurately calculated
    // therefore we use load event and calculate rect after  all assets load
    // using router event to subsbscribe to instance of navigationEnd event also had a weird bug ,even when bgReset() was run with setTimout, on initial load navRect would have wrong value.
    // cause of bug is external asset loading, which can probably be fixed by prefetching or self hosting those assets
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
    const activeLink = this.navRef.nativeElement.querySelector<HTMLElement>('.active');
    if (!activeLink || !this.navRect) return;
    const activeLinkRect = activeLink.getBoundingClientRect();
    this.bgElPosition.set(activeLinkRect.left - this.navRect.left);
    this.bgElWidth.set(activeLinkRect.width);
  };
  logoReset = () => {
    const homeLink = document.querySelector<HTMLElement>('.homeLink');
    if (homeLink) {
      const heomLinkWidth = homeLink.getBoundingClientRect().width;
      this.bgElPosition.set(0);
      this.bgElWidth.set(heomLinkWidth);
    }
  };
}
