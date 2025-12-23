import { Component, LOCALE_ID, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Loader } from '../../components/loader/loader';
import { ProfileBtn } from './components/nav-menu/nav-menu';
import { Navigation } from './components/navigation/navigation';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Loader, ProfileBtn, Navigation],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  @ViewChild(Navigation) navigationComponent!: Navigation;
  private currentLocale = inject(LOCALE_ID);
  loading = signal(false);

  logoReset = () => {
    // Calls method from the Navigation component
    this.navigationComponent?.logoReset();
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
