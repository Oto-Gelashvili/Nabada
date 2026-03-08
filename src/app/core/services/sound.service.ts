import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly sessionEndSound = new Audio('sounds/session-end-sound.mp3');

  playSessionEnd(): void {
    this.sessionEndSound.currentTime = 0;
    this.sessionEndSound.play();
  }
}
