import { Component } from '@angular/core';
import { Navigation } from '../navigation/navigation';
import { NavMenu } from '../nav-menu/nav-menu';
import { LanguageSwitcher } from '../../../../shared/components/language-switcher/language-switcher';

@Component({
  selector: 'app-auth-header',
  imports: [NavMenu, Navigation, LanguageSwitcher],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
