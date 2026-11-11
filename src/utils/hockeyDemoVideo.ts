/**
 * Generates dynamic high-definition hockey simulation video clips (60fps)
 * with authentic rink markings (blue lines, goal crease, faceoff circles, puck, skaters, scoreboard)
 * converted to local Blob URLs for instant seamless playlist testing.
 */

export function generateHockeySampleClip(period: number = 1, title: string = 'Period 1 Breakout'): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      resolve('');
      return;
    }

    const stream = canvas.captureStream(30);
    let options: MediaRecorderOptions = { mimeType: 'video/webm' };
    if (!MediaRecorder.isTypeSupported('video/webm')) {
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, options);
    } catch {
      resolve('');
      return;
    }

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    mediaRecorder.start();

    // 8 seconds per clip at 30fps
    const totalFrames = 240;
    let currentFrame = 0;

    function renderFrame() {
      if (!ctx) return;
      const t = currentFrame / 30; // seconds

      // 1. Ice Surface Background
      const iceGrad = ctx.createLinearGradient(0, 0, 0, 720);
      iceGrad.addColorStop(0, '#e2ecf5');
      iceGrad.addColorStop(0.5, '#f0f5fa');
      iceGrad.addColorStop(1, '#d8e5f2');
      ctx.fillStyle = iceGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // Ice blade cut textures
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const seed = (i * 123 + currentFrame * 0.1) % 1200;
        ctx.beginPath();
        ctx.moveTo(seed, (i * 35) % 700);
        ctx.lineTo(seed + 60, ((i * 35) % 700) + 15);
        ctx.stroke();
      }

      // Rink Boards Edge
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1280, 40); // Top board
      ctx.fillRect(0, 680, 1280, 40); // Bottom board
      ctx.fillStyle = '#fbbf24'; // Yellow kick plate
      ctx.fillRect(0, 670, 1280, 10);
      ctx.fillRect(0, 40, 1280, 10);

      // Red Center Line (dashed center ice)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 8;
      ctx.setLineDash([20, 14]);
      ctx.beginPath();
      ctx.moveTo(200, 50);
      ctx.lineTo(200, 670);
      ctx.stroke();
      ctx.setLineDash([]);

      // Blue Line (Offside line)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(540, 50);
      ctx.lineTo(540, 670);
      ctx.stroke();

      // Goal Line (Red)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(1100, 50);
      ctx.lineTo(1100, 670);
      ctx.stroke();

      // Goal Crease (Semi-circle light blue with red border)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(1100, 360, 90, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.fill();
      ctx.stroke();

      // Hockey Goal Net
      ctx.fillStyle = '#b91c1c'; // Red posts
      ctx.lineWidth = 6;
      ctx.strokeRect(1100, 320, 45, 80);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      // Net mesh pattern
      ctx.strokeStyle = 'rgba(200,200,200,0.6)';
      ctx.lineWidth = 1.5;
      for (let ny = 325; ny <= 395; ny += 10) {
        ctx.beginPath();
        ctx.moveTo(1100, ny);
        ctx.lineTo(1145, ny);
        ctx.stroke();
      }

      // Offensive Face-off Circle (Top and Bottom)
      [220, 500].forEach((cy) => {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(880, cy, 95, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(880, cy, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // Animated Skaters and Puck with period-specific variations
      const skaterProgress = (t % 4) / 4;
      const speedMult = period === 1 ? 1 : period === 2 ? 1.25 : 1.4;
      const skaterX = 300 + skaterProgress * 700;
      const skaterY = 320 + Math.sin(t * (3 + period)) * (60 + period * 15);

      const defX = 750 + Math.sin(t * 2) * 90;
      const defY = 350 + Math.cos(t * (2.5 + period * 0.5)) * 120;

      const goalieX = 1080;
      const goalieY = 360 + Math.sin(t * 4.5) * 40;

      // Draw Goalie
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(goalieX, goalieY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = period === 3 ? '#e11d48' : '#059669';
      ctx.beginPath();
      ctx.arc(goalieX - 5, goalieY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw Defender
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(defX, defY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Draw Puck Carrier
      ctx.fillStyle = period === 2 ? '#7c3aed' : '#0284c7';
      ctx.beginPath();
      ctx.arc(skaterX, skaterY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Stick
      const stickX = skaterX + 25;
      const stickY = skaterY + 15;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(skaterX, skaterY);
      ctx.lineTo(stickX, stickY);
      ctx.stroke();

      // Puck Physics
      let puckX = stickX + 6;
      let puckY = stickY + 2;

      if (skaterProgress > 0.7) {
        const shotPhase = (skaterProgress - 0.7) / 0.3;
        puckX = stickX + shotPhase * (1110 - stickX);
        puckY = stickY + shotPhase * (355 - stickY);
      }

      // Draw Puck
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(puckX + 2, puckY + 2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(puckX, puckY, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Broadcast Scoreboard with Period Info
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(40, 10, 520, 32);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(40, 10, 520, 32);

      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`PERIOD ${period}`, 55, 31);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`HAWKS ${period + 1}`, 155, 31);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText('—', 245, 31);

      ctx.fillStyle = '#f87171';
      ctx.fillText(`BLUES ${period}`, 275, 31);

      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#e2e8f0';
      const clockSecs = Math.max(0, 18 * 60 - Math.floor(t));
      const mins = Math.floor(clockSecs / 60);
      const secs = (clockSecs % 60).toString().padStart(2, '0');
      ctx.fillText(`${mins}:${secs}`, 365, 31);

      const frameStr = `FRM #${currentFrame.toString().padStart(4, '0')}`;
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(frameStr, 445, 31);

      currentFrame++;
      if (currentFrame < totalFrames) {
        requestAnimationFrame(renderFrame);
      } else {
        mediaRecorder.stop();
      }
    }

    renderFrame();
  });
}
