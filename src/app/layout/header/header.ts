import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { NgStyle } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [NgStyle, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements AfterViewInit {
  @ViewChild('nav', { static: true }) navRef!: ElementRef<HTMLElement>;

  bgElPosition = 0;
  bgElWidth = 0;
  private navRect!: DOMRect;
  private router = inject(Router);

  ngAfterViewInit() {
    this.navRect = this.navRef.nativeElement.getBoundingClientRect();

    // so i can remember
    // because ihave bgElement that should attach to active link on load, this was only thing that helpmed to chive that
    // i think router wasnt able to set url fast enough, so activeLink was correctly initialized
    // as without navigationEnd when i used debbuger on resetBg method, activeLink would just return '/' in every case, even when standing on /products
    // that was maybe (not sure) reason why i didng use routerLinkActives .active class to get current active link
    // as in that case it would return null for activeLink
    // first time i felt like next.js is better, as there is terrible docs and very small amount of content about this topic, next.js eco is better
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.resetBg();
    });
  }

  moveBg(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const targetRect = target.getBoundingClientRect();

    this.bgElPosition = targetRect.left - this.navRect.left;
    this.bgElWidth = targetRect.width;
  }

  resetBg() {
    const currentPath = this.router.url.slice(1);
    let activeLink: HTMLElement | null;
    if (currentPath !== '') {
      activeLink = this.navRef.nativeElement.querySelector(`#${currentPath}`);
    } else {
      activeLink = this.navRef.nativeElement.querySelector('#sessions');
    }
    if (activeLink) {
      const activeLinkRect = activeLink.getBoundingClientRect();
      this.bgElPosition = activeLinkRect.left - this.navRect.left;
      this.bgElWidth = activeLinkRect.width;
    }
  }
}
