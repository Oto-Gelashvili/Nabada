import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SoundService } from './sound.service';

describe('SoundService', () => {
  let service: SoundService;
  let mockPlay: () => Promise<void>;
  let mockAudio: Partial<HTMLAudioElement>;

  beforeEach(() => {
    mockPlay = vi.fn().mockResolvedValue(undefined) as unknown as () => Promise<void>;
    mockAudio = { play: mockPlay, currentTime: 0 };

    vi.stubGlobal(
      'Audio',
      vi.fn().mockImplementation(function () {
        return mockAudio;
      }),
    );
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('playSessionEnd calls play', () => {
    service.playSessionEnd();
    expect(mockPlay).toHaveBeenCalledOnce();
  });

  it('playSessionEnd resets currentTime to 0', () => {
    mockAudio.currentTime = 5;
    service.playSessionEnd();
    expect(mockAudio.currentTime).toBe(0);
  });
});
