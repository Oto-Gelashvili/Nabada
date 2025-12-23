import { Component } from '@angular/core';
import { Navigation } from './components/navigation/navigation';
import { LanguageSwitcher } from './components/language-switcher/language-switcher';
import { NavMenu } from './components/nav-menu/nav-menu';

@Component({
  selector: 'app-header',
  imports: [NavMenu, Navigation, LanguageSwitcher],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
