import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  signal,
  Inject,
  LOCALE_ID,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Loader } from '../../components/loader/loader';

@Component({
  selector: 'app-header',
  imports: [NgStyle, RouterLink, RouterLinkActive, Loader],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements AfterViewInit, OnDestroy {
  @ViewChild('nav', { static: true }) navRef!: ElementRef<HTMLElement>;
  bgElPosition = signal(0);
  bgElWidth = signal(0);
  private navRect!: DOMRect;
  loading = signal(false);

  constructor(@Inject(LOCALE_ID) private currentLocale: string) {}

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
    const activeLink = document.querySelector<HTMLElement>('.active');
    if (!activeLink || !this.navRect) return;
    const activeLinkRect = activeLink.getBoundingClientRect();
    this.bgElPosition.set(activeLinkRect.left - this.navRect.left);
    this.bgElWidth.set(activeLinkRect.width);
  };
  switchLang() {
    const pathname = window.location.pathname;
    this.loading.set(true);

    if (this.currentLocale === 'ka') {
      window.location.href = pathname.replace('/ka', '/en');
    } else {
      window.location.href = pathname.replace('/en', '/ka');
    }
  }
}
