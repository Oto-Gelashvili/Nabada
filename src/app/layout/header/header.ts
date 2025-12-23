import { Component } from '@angular/core';
import { ProfileBtn } from './components/nav-menu/nav-menu';
import { Navigation } from './components/navigation/navigation';
import { LanguageSwitcher } from './components/language-switcher/language-switcher';

@Component({
  selector: 'app-header',
  imports: [ProfileBtn, Navigation, LanguageSwitcher],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
