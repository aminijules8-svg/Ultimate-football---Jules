// Inject intro sequence loader into main.js or game initialization
import { runIntroSequence } from './ui/intro.js';

// Run intro on startup
window.addEventListener('DOMContentLoaded', () => {
  runIntroSequence(() => {
    console.log('FC26 Intro completed. Starting game...');
  });
});
