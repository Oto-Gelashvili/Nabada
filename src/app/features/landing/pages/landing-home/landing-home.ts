import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface MockBlock {
  left: number;
  width: number;
  active: boolean;
}

interface MockStation {
  name: string;
  blocks: MockBlock[];
}
@Component({
  selector: 'app-landing-home',
  imports: [],
  templateUrl: './landing-home.html',
  styleUrl: './landing-home.css',
})
export class LandingHome {
  readonly mockStations: MockStation[] = [
    {
      name: 'PS1',
      blocks: [
        { left: 5, width: 22, active: false },
        { left: 35, width: 18, active: true },
        { left: 62, width: 14, active: false },
      ],
    },
    {
      name: 'PS2',
      blocks: [
        { left: 10, width: 30, active: false },
        { left: 55, width: 25, active: true },
      ],
    },
    {
      name: 'PS3',
      blocks: [
        { left: 2, width: 16, active: false },
        { left: 28, width: 20, active: false },
        { left: 70, width: 18, active: true },
      ],
    },
    {
      name: 'PS4',
      blocks: [{ left: 15, width: 40, active: true }],
    },
    {
      name: 'PS5',
      blocks: [
        { left: 8, width: 18, active: false },
        { left: 40, width: 22, active: false },
        { left: 75, width: 12, active: true },
      ],
    },
  ];
}
