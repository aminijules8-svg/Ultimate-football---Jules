// Enhanced EA Sports FC26 Cinematic Intro with Detailed Branding
import { crowdAudio } from '../audio/crowd.js';

export function runEnhancedIntro(onComplete) {
  if (sessionStorage.getItem('fc26_intro_played_enhanced')) {
    onComplete();
    return;
  }
  sessionStorage.setItem('fc26_intro_played_enhanced', 'true');

  // Create high-detail intro container
  const container = document.createElement('div');
  container.id = 'fc26-enhanced-intro';
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #0a0f14 0%, #1a2332 50%, #0f172a 100%);
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(220, 38, 38, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.2) 0%, transparent 50%),
      url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"#0f172a\"/><path d=\"M100 20 L180 80 L100 140 L20 80 Z\" fill=\"#dc2626\"/><circle cx=\"100\" cy=\"100\" r=\"40\" fill=\"#fbbf24\"/></svg>') center/cover no-repeat;
    z-index: 99999; display: flex; flex-direction: column;
    align-items: center; justify-content: center; font-family: 'Barlow Condensed', Arial, sans-serif;
    color: #ffffff; opacity: 1; transition: opacity 0.8s ease-in-out;
    user-select: none; overflow: hidden;
  `;

  // Add noise texture overlay
  const noiseOverlay = document.createElement('div');
  noiseOverlay.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.03) 0px,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px,
      transparent 4px
    ); pointer-events: none; z-index: 1;
  `;
  container.appendChild(noiseOverlay);

  // Content wrapper with glassmorphism
  const content = document.createElement('div');
  content.style.cssText = `
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transform: scale(0.9); opacity: 0; transition: all 1.5s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative; z-index: 2; text-align: center;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(220, 38, 38, 0.3);
    border-radius: 20px;
    padding: 60px 80px;
    box-shadow: 
      0 30px 80px rgba(0, 0, 0, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  `;
  container.appendChild(content);

  document.body.appendChild(container);

  // Initialize audio
  let ac = null;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    crowdAudio.start(ac);
  } catch(e) {}

  // Enhanced sound generator with more impact
  const playEnhancedSound = () => {
    if (!ac) return;
    const t = ac.currentTime;

    // Epic sub-bass kick (FC26 name reveal)
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(41.2, t); // C1
    osc.frequency.exponentialRampToValueAtTime(20.6, t + 3.0);
    osc.frequency.linearRampToValueAtTime(82.4, t + 6.0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(100, t + 4.0);
    filter.frequency.linearRampToValueAtTime(800, t + 6.0);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.9, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 9.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 9.2);

    // Multi-layered brass section (It's in the game)
    setTimeout(() => {
      if (!ac) return;
      const t2 = ac.currentTime;
      const chords = [[130.81, 146.83, 164.81, 196.00, 220.00], [65.41, 73.42, 82.41, 98.00, 110.00]];
      chords.forEach((chord, chordIndex) => {
        setTimeout(() => {
          chord.forEach((freq, i) => {
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.type = 'triangle';
            o.frequency.value = freq * (0.8 + (chordIndex * 0.2));
            g.gain.setValueAtTime(0.001, t2);
            g.gain.linearRampToValueAtTime(0.4 * (0.7 - i * 0.1), t2 + 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, t2 + 5.0);
            o.connect(g);
            g.connect(ac.destination);
            o.start(t2);
            o.stop(t2 + 5.2);
          });
        }, i * 80);
      });
    }, 3000);
  };

  // Phase 1 (0-2.5s): Epic FC26 Emblem Reveal
  content.innerHTML = `
    <div style="position: relative; margin-bottom: 40px;">
      <!-- Glow effect behind emblem -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  width: 300px; height: 300px; background: radial-gradient(circle, rgba(220, 38, 38, 0.5) 0%, transparent 70%);
                  filter: blur(2px); z-index: -1;"></div>
      
      <!-- Main FC26 emblem with detailed styling -->
      <div style="width: 280px; height: 280px; position: relative;">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; filter: drop-shadow(0 0 30px rgba(251, 191, 36, 0.6));">
          <!-- Enhanced background with gradient -->
          <circle cx="256" cy="256" r="240" fill="url(#mainGradient)" stroke="#fbbf24" stroke-width="10"/>
          <defs>
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="fill:#1e3a8a"/>
              <stop offset="1%" style="fill:#0f52ba"/>
            </linearGradient>
          </defs>
          
          <!-- Enhanced football with 3D styling -->
          <path d="M256 80 L150 160 L180 240 L256 260 L332 240 L362 160 Z" 
                fill="url(#footballGradient)" 
                stroke="#fbbf24" 
                stroke-width="4"
                stroke-linejoin="round"
                style="filter: drop-shadow(0 0 10px rgba(220, 38, 38, 0.8));"/>
          <defs>
            <linearGradient id="footballGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="fill:#dc2626"/>
              <stop offset="100%" style="fill:#b91c1c"/>
            </linearGradient>
          </defs>
          
          <!-- Football details -->
          <path d="M256 260 L220 300 L180 280 L256 340 L332 280 L292 300 Z" 
                fill="#fbbf24" opacity="0.9" 
                stroke="#ffffff" 
                stroke-width="2"/>
          
          <!-- Eye with highlight -->
          <circle cx="200" cy="180" r="14" fill="white" stroke="#1e3a8a" stroke-width="3"/>
          <circle cx="200" cy="180" r="5" fill="#1e3a8a"/>
          
          <!-- Stitches with texture -->
          <rect x="220" y="185" width="40" height="5" fill="#ffffff" opacity="0.8" transform="rotate(45 220 185)"/>
          <rect x="248" y="170" width="16" height="4" fill="#ffffff" opacity="0.9" transform="rotate(-30 248 170)"/>
          
          <!-- FC26 branding with enhanced styling -->
          <text x="256" y="285" text-anchor="middle" dominant-baseline="middle" 
                fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="36px"
                style="text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);">FC26</text>
          
          <!-- Subtitle -->
          <text x="256" y="335" text-anchor="middle" 
                fill="#fbbf24" font-family="Arial, sans-serif" font-weight="bold" font-size="18px"
                style="text-shadow: 0 0 10px rgba(251, 191, 36, 0.6); letter-spacing: 0.1em;">ULTIMATE FOOTBALL</text>
        </svg>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 52px; font-weight: 900; font-style: italic; 
                 letter-spacing: 0.08em; 
                 background: linear-gradient(135deg, #ffffff 0%, #fbbf24 50%, #dc2626 100%);
                 -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                 margin: 0 0 12px 0; text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);">
        FC26 Ultimate Football
      </h1>
      <p style="font-size: 18px; color: #94a3b8; letter-spacing: 0.25em; 
                 text-transform: uppercase; margin: 0; font-weight: 300;
                 opacity: 0.9;">PRODUCED BY ULTIMATE FOOTBALL STUDIO</p>
    </div>
    
    <div style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-top: 20px;">
      <div style="text-align: center;">
        <div style="width: 60px; height: 60px; background: #1e3a8a; border-radius: 10px;
                    border: 2px solid #fbbf24; display: flex; align-items: center;
                    justify-content: center; margin-bottom: 8px;
                    box-shadow: 0 4px 15px rgba(30, 58, 138, 0.5);">
          <span style="font-size: 24px; font-weight: bold; color: #fbbf24;">EA</span>
        </div>
        <div style="font-size: 10px; color: #fbbf24; letter-spacing: 0.1em;">SPORTS</div>
      </div>
      <div style="width: 40px; height: 2px; background: linear-gradient(90deg, transparent, #dc2626, transparent);
                  opacity: 0.6;"></div>
      <div style="text-align: center;">
        <div style="width: 60px; height: 60px; background: #0f172a; border-radius: 10px;
                    border: 2px solid #dc2626; display: flex; align-items: center;
                    justify-content: center; margin-bottom: 8px;
                    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.5);">
          <span style="font-size: 16px; font-weight: bold; color: #dc2626;">⚽</span>
        </div>
        <div style="font-size: 10px; color: #dc2626; letter-spacing: 0.1em;">FOOTBALL</div>
      </div>
      <div style="width: 40px; height: 2px; background: linear-gradient(90deg, transparent, #fbbf24, transparent);
                  opacity: 0.6;"></div>
      <div style="text-align: center;">
        <div style="width: 60px; height: 60px; background: #0c4a6e; border-radius: 10px;
                    border: 2px solid #38bdf8; display: flex; align-items: center;
                    justify-content: center; margin-bottom: 8px;
                    box-shadow: 0 4px 15px rgba(12, 74, 110, 0.5);">
          <span style="font-size: 20px; font-weight: bold; color: #38bdf8;">🎮</span>
        </div>
        <div style="font-size: 10px; color: #38bdf8; letter-spacing: 0.1em;">GENIE</div>
      </div>
    </div>
    
    <div style="margin-top: 40px; padding: 20px 40px; background: rgba(0, 0, 0, 0.4);
                border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);">
      <div style="font-size: 14px; color: #cbd5e1; letter-spacing: 0.15em; text-transform: uppercase;
                  text-align: center; font-weight: 300;
                  animation: pulse 2s infinite;">
        “EA SPORTS • FC26 • IT'S IN THE GAME”
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    content.style.transform = 'scale(1)';
    content.style.opacity = '1';
  });

  playEnhancedSound();

  // Phase 2 (2.5-5.5s): Developer Studio with EA Branding
  setTimeout(() => {
    content.style.opacity = '0';
    content.style.transform = 'scale(1.05)';
    setTimeout(() => {
      content.innerHTML = `
        <div style="text-align: center;">
          <div style="margin-bottom: 30px;">
            <div style="font-size: 16px; color: #fbbf24; letter-spacing: 0.3em; 
                       text-transform: uppercase; margin-bottom: 15px; font-weight: 300;
                       animation: glow 3s infinite;">
              DEVELOPED BY
            </div>
            <div style="font-size: 52px; font-weight: 900; letter-spacing: 0.1em;
                       background: linear-gradient(135deg, #ffffff 0%, #fbbf24 100%);
                       -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                       margin-bottom: 10px;
                       text-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);">
              ULTIMATE FOOTBALL STUDIO
            </div>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: center; gap: 40px; margin: 30px 0;">
            <div style="text-align: center;">
              <div style="width: 100px; height: 100px; background: #1e3a8a;
                          border-radius: 15px; border: 3px solid #fbbf24;
                          display: flex; flex-direction: column; align-items: center;
                          justify-content: center; margin-bottom: 10px;
                          box-shadow: 0 10px 30px rgba(30, 58, 138, 0.6);
                          animation: float 3s infinite ease-in-out;">
                <span style="font-size: 28px; font-weight: bold; color: #fbbf24;">EA</span>
                <span style="font-size: 10px; color: white; margin-top: 2px;">SPORTS</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; letter-spacing: 0.1em;">BRANDING</div>
            </div>
            
            <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #dc2626, transparent);
                        opacity: 0.8;"></div>
            
            <div style="text-align: center;">
              <div style="width: 100px; height: 100px; background: #dc2626;
                          border-radius: 15px; border: 3px solid #fbbf24;
                          display: flex; flex-direction: column; align-items: center;
                          justify-content: center; margin-bottom: 10px;
                          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.6);
                          animation: float 3s infinite ease-in-out 0.5s;">
                <span style="font-size: 32px; font-weight: bold; color: #fbbf24;">⚽</span>
                <span style="font-size: 10px; color: white; margin-top: 2px;">FOOTBALL</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; letter-spacing: 0.1em;">ENGINE</div>
            </div>
            
            <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #fbbf24, transparent);
                        opacity: 0.8;"></div>
            
            <div style="text-align: center;">
              <div style="width: 100px; height: 100px; background: #0c4a6e;
                          border-radius: 15px; border: 3px solid #38bdf8;
                          display: flex; flex-direction: column; align-items: center;
                          justify-content: center; margin-bottom: 10px;
                          box-shadow: 0 10px 30px rgba(12, 74, 110, 0.6);
                          animation: float 3s infinite ease-in-out 1s;">
                <span style="font-size: 28px; font-weight: bold; color: #38bdf8;">🎮</span>
                <span style="font-size: 10px; color: white; margin-top: 2px;">NEXT-GEN</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; letter-spacing: 0.1em;">SIMULATION</div>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding: 15px 30px;
                      background: linear-gradient(135deg, rgba(30, 58, 138, 0.3), rgba(220, 38, 38, 0.3));
                      border-radius: 25px; border: 2px solid rgba(251, 191, 36, 0.5);
                      backdrop-filter: blur(10px);
                      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);">
            <div style="font-size: 14px; color: white; letter-spacing: 0.2em; text-transform: uppercase;
                        text-align: center; font-weight: 500;
                        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);">
              Powered by FC26 Engine • Next-Gen Sports Experience • Ultimate Realism
            </div>
          </div>
        </div>
      `;
      content.style.transform = 'scale(0.95)';
      content.style.opacity = '1';
    }, 600);
  }, 3500);

  // Phase 3 (5.5-7.5s): EA Sports Signature Branded Experience
  setTimeout(() => {
    content.style.opacity = '0';
    setTimeout(() => {
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 24px; color: #dc2626; letter-spacing: 0.3em; 
                     text-transform: uppercase; margin-bottom: 20px; font-weight: 300;
                     animation: pulse 2s infinite;">
            EA SPORTS SIGNATURE EXPERIENCE
          </div>
          
          <div style="position: relative; margin: 30px 0;">
            <div style="width: 200px; height: 200px; border-radius: 50%;
                        background: linear-gradient(135deg, #1e3a8a, #0c4a6e);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 20px 50px rgba(12, 74, 110, 0.6);
                        border: 3px solid #fbbf24;
                        animation: rotate 10s infinite linear;">
              <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: 900; color: #fbbf24; margin-bottom: 5px;">EA</div>
                <div style="font-size: 14px; color: white; letter-spacing: 0.1em;">SPORTS</div>
              </div>
            </div>
          </div>
          
          <div style="font-size: 36px; font-weight: 300; color: #fbbf24;
                     letter-spacing: 0.2em; margin-bottom: 15px;
                     text-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);">
            It's in the game.
          </div>
          
          <div style="display: flex; align-items: center; gap: 20px; margin-top: 20px;
                      opacity: 0.7;">
            <div style="width: 60px; height: 2px; background: #dc2626;"></div>
            <div style="font-size: 12px; color: #94a3b8; letter-spacing: 0.2em;
                       text-transform: uppercase;">FC26 EXCLUSIVE</div>
            <div style="width: 60px; height: 2px; background: #fbbf24;"></div>
          </div>
        </div>
      `;
      content.style.transform = 'scale(1)';
      content.style.opacity = '1';
    }, 600);
  }, 6000);

  // Phase 4 (8-10s): Smooth fade to game
  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => {
      container.remove();
      if (onComplete) onComplete();
    }, 1000);
  }, 9500);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes glow { 0%, 100% { text-shadow: 0 0 20px rgba(251, 191, 36, 0.5); } 50% { text-shadow: 0 0 40px rgba(251, 191, 36, 0.9); } }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);
