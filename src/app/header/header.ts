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
