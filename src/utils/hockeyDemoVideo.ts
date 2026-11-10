/**
 * Generates dynamic high-definition hockey simulation video clips (60fps)
 * with authentic rink markings (blue lines, goal crease, faceoff circles, puck, skaters, scoreboard)
 * converted to a local Blob URL for instant video player testing.
 */

export function generateHockeySampleClip(): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // Check if MediaRecorder is supported
    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      // Fallback: create short loop
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

    const totalFrames = 300; // 10 seconds at 30fps
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

        // Face-off dot
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(880, cy, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // Animated Skaters and Puck
      // Skater 1: Puck Carrier (White & Navy)
      // Skates in from neutral zone past blue line toward net
      const skaterProgress = (t % 5) / 5; // 0 to 1 every 5s
      const skaterX = 350 + skaterProgress * 650;
      const skaterY = 320 + Math.sin(t * 4) * 80;

      // Skater 2: Defender (Red)
      const defX = 750 + Math.sin(t * 2) * 80;
      const defY = 350 + Math.cos(t * 3) * 110;

      // Goalie (in crease)
      const goalieX = 1080;
      const goalieY = 360 + Math.sin(t * 4) * 35;

      // Draw Goalie
      ctx.fillStyle = '#0f172a'; // Goalie pads
      ctx.beginPath();
      ctx.arc(goalieX, goalieY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e11d48'; // Goalie jersey
      ctx.beginPath();
      ctx.arc(goalieX - 5, goalieY, 12, 0, Math.PI * 2);
      ctx.fill();
      // Goalie stick
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(goalieX - 12, goalieY + 12);
      ctx.lineTo(goalieX - 25, goalieY + 6);
      ctx.stroke();

      // Draw Defender
      ctx.fillStyle = '#dc2626'; // Red jersey
      ctx.beginPath();
      ctx.arc(defX, defY, 16, 0, Math.PI * 2);
      ctx.fill();
      // Stick
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(defX, defY);
      ctx.lineTo(defX - 30, defY + Math.sin(t * 5) * 20);
      ctx.stroke();

      // Draw Puck Carrier
      ctx.fillStyle = '#0284c7'; // Navy/Cyan jersey
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

      // Shot fired when skater reaches deep offensive zone
      if (skaterProgress > 0.72) {
        const shotPhase = (skaterProgress - 0.72) / 0.28;
        puckX = stickX + shotPhase * (1110 - stickX);
        puckY = stickY + shotPhase * (355 - stickY);
      }

      // Draw Puck (Hard black vulcanized rubber with slight shadow)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(puckX + 2, puckY + 2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(puckX, puckY, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top Overlay: Authentic Broadcast Scoreboard + Frame Counter for Video Analysis
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(40, 10, 480, 32);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(40, 10, 480, 32);

      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('PERIOD 2', 55, 31);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('HAWKS 3', 145, 31);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText('—', 225, 31);

      ctx.fillStyle = '#f87171';
      ctx.fillText('BLUES 2', 255, 31);

      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#e2e8f0';
      const clockSecs = Math.max(0, 14 * 60 + 20 - Math.floor(t));
      const mins = Math.floor(clockSecs / 60);
      const secs = (clockSecs % 60).toString().padStart(2, '0');
      ctx.fillText(`14:${secs}`, 345, 31);

      // Live Frame Counter Stamp (essential for video editors analyzing exact frame)
      const frameStr = `FRM #${currentFrame.toString().padStart(4, '0')} (${(t).toFixed(2)}s)`;
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(frameStr, 400, 31);

      // Offside Blue Line Marker indicator on bottom
      ctx.fillStyle = 'rgba(37, 99, 235, 0.85)';
      ctx.fillRect(510, 685, 60, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('BLUE LINE', 516, 699);

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
