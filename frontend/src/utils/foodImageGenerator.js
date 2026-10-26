// High-fidelity food image synthesis for instant 1-click computer vision testing
export function generateFoodSampleImage(type) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  const centerX = 150;
  const centerY = 150;
  const radius = 130;

  // Background surface
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 300, 300);

  // Vessel Rim (Stainless Steel / Copper Feast Vessel)
  const rimGrad = ctx.createRadialGradient(centerX, centerY, radius - 15, centerX, centerY, radius + 5);
  rimGrad.addColorStop(0, '#94a3b8');
  rimGrad.addColorStop(0.5, '#cbd5e1');
  rimGrad.addColorStop(0.9, '#64748b');
  rimGrad.addColorStop(1, '#334155');

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // Vessel Interior Clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 14, 0, Math.PI * 2);
  ctx.clip();

  if (type === 'biryani') {
    // Golden Turmeric / Saffron Basmati Rice Base
    const riceGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
    riceGrad.addColorStop(0, '#f59e0b');
    riceGrad.addColorStop(0.5, '#d97706');
    riceGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = riceGrad;
    ctx.fillRect(0, 0, 300, 300);

    // Rice Grains & Spices Texture Granularity
    for (let i = 0; i < 900; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius - 20);
      const gx = centerX + Math.cos(angle) * dist;
      const gy = centerY + Math.sin(angle) * dist;

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(Math.random() * Math.PI);

      // Basmati grain
      ctx.fillStyle = Math.random() > 0.3 ? '#fef3c7' : '#fde68a';
      ctx.fillRect(-4, -1, 8, 2.5);

      // Fried onion / clove flecks
      if (Math.random() > 0.88) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-3, -1, 6, 2);
      }
      // Fresh mint/coriander
      if (Math.random() > 0.92) {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (type === 'curry') {
    // Rich Red-Orange Dal Makhani & Sambar Curry
    const curryGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
    curryGrad.addColorStop(0, '#ea580c');
    curryGrad.addColorStop(0.6, '#c2410c');
    curryGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = curryGrad;
    ctx.fillRect(0, 0, 300, 300);

    // Liquid gloss and cumin / mustard seeds
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius - 22);
      const gx = centerX + Math.cos(angle) * dist;
      const gy = centerY + Math.sin(angle) * dist;

      ctx.fillStyle = Math.random() > 0.5 ? '#7c2d12' : '#431407';
      ctx.beginPath();
      ctx.arc(gx, gy, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cream swirl
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0.2, Math.PI * 1.5);
    ctx.stroke();

    // Coriander garnish
    for (let i = 0; i < 25; i++) {
      const gx = centerX + (Math.random() - 0.5) * 50;
      const gy = centerY + (Math.random() - 0.5) * 50;
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'roti') {
    // Warm Wheat Flatbreads / Naan
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, 300, 300);

    // Overlapping Rotis
    const rotis = [
      { x: centerX - 25, y: centerY - 25, r: 70 },
      { x: centerX + 25, y: centerY + 15, r: 68 },
      { x: centerX - 10, y: centerY + 20, r: 72 },
    ];

    rotis.forEach((r) => {
      const breadGrad = ctx.createRadialGradient(r.x, r.y, 5, r.x, r.y, r.r);
      breadGrad.addColorStop(0, '#fef08a');
      breadGrad.addColorStop(0.7, '#fde047');
      breadGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = breadGrad;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fill();

      // Char blisters & toasted spots
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (r.r - 8);
        const bx = r.x + Math.cos(angle) * dist;
        const by = r.y + Math.sin(angle) * dist;
        ctx.fillStyle = Math.random() > 0.4 ? '#78350f' : '#451a03';
        ctx.beginPath();
        ctx.ellipse(bx, by, Math.random() * 5 + 2, Math.random() * 3 + 1, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else if (type === 'vegetables') {
    // Emerald Vegetable Medley
    const vegGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
    vegGrad.addColorStop(0, '#15803d');
    vegGrad.addColorStop(0.7, '#166534');
    vegGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = vegGrad;
    ctx.fillRect(0, 0, 300, 300);

    // Peas, carrots, curry leaves
    for (let i = 0; i < 450; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius - 22);
      const vx = centerX + Math.cos(angle) * dist;
      const vy = centerY + Math.sin(angle) * dist;

      const rand = Math.random();
      if (rand < 0.35) {
        // Green pea
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (rand < 0.65) {
        // Diced carrot
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(vx - 3, vy - 3, 6, 6);
      } else if (rand < 0.85) {
        // Grated coconut flecks
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(vx - 2, vy - 1, 4, 1.5);
      } else {
        // Mustard / spice
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(vx, vy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Vessel Inner Shadow & Specular Rim Highlight
  const innerShadow = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius - 14);
  innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
  innerShadow.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = innerShadow;
  ctx.fillRect(0, 0, 300, 300);

  ctx.restore();

  // Glass/Steel Reflection Arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 6, -Math.PI * 0.7, -Math.PI * 0.2);
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.92);
}
