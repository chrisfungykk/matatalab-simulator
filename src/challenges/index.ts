import easy from './easy.json';
import medium from './medium.json';
import hard from './hard.json';
import type { ChallengeConfig } from '../core/types';

export const builtInChallenges: ChallengeConfig[] = [easy, medium, hard] as ChallengeConfig[];
