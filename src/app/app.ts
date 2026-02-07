import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorModal } from './shared/components/error-modal/error-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorModal],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
