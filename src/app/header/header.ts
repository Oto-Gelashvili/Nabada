import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-header',
  imports: [NgStyle, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements AfterViewInit {
  @ViewChild('nav', { static: true }) navRef!: ElementRef<HTMLElement>;
  bgElPosition = 0;
  bgElWidth = 0;
  private navRect!: DOMRect;

  ngAfterViewInit() {
    this.navRect = this.navRef.nativeElement.getBoundingClientRect();
  }

  moveBg(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const targetRect = target.getBoundingClientRect();

    this.bgElPosition = targetRect.left - this.navRect.left;
    this.bgElWidth = targetRect.width;
  }

  resetBg() {
    this.bgElPosition = 0;
  }
}
