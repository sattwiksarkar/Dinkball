// VenueBackdrop — procedural per-venue background drawn on Canvas.

const PALETTES = {
  garden:           { sky: '#a8d8ea', mid: '#3d6b47', acc: '#a8d5a2' },
  sports_hall:      { sky: '#d4a84b', mid: '#8b6914', acc: '#f5deb3' },
  car_park:         { sky: '#888888', mid: '#4a4a4a', acc: '#ff6b35' },
  rooftop:          { sky: '#1a3a5c', mid: '#2c5282', acc: '#87ceeb' },
  beach:            { sky: '#87ceeb', mid: '#c2956c', acc: '#ffd700' },
  indoor_arena:     { sky: '#0a0a1a', mid: '#1c1c2e', acc: '#9b59b6' },
  national_stadium: { sky: '#050510', mid: '#0d0d1a', acc: '#ffd700' },
  grand_final:      { sky: '#000005', mid: '#0a0a0f', acc: '#ff4500' },
};

function rng(seed) {
  // Simple seeded RNG (LCG)
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };
}

export default class VenueBackdrop {
  draw(ctx, venueId) {
    const pal = PALETTES[venueId] || PALETTES.garden;
    switch (venueId) {
      case 'garden':           this._garden(ctx, pal); break;
      case 'sports_hall':      this._sportsHall(ctx, pal); break;
      case 'car_park':         this._carPark(ctx, pal); break;
      case 'rooftop':          this._rooftop(ctx, pal); break;
      case 'beach':            this._beach(ctx, pal); break;
      case 'indoor_arena':     this._indoorArena(ctx, pal); break;
      case 'national_stadium': this._nationalStadium(ctx, pal); break;
      case 'grand_final':      this._grandFinal(ctx, pal); break;
      default:
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 320, 240);
    }
  }

  _garden(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 140);
    ctx.fillStyle = p.mid; ctx.fillRect(0, 140, 320, 100);
    // Sun
    ctx.fillStyle = '#fffde0'; ctx.beginPath(); ctx.arc(260, 28, 14, 0, Math.PI * 2); ctx.fill();
    // Hills
    ctx.fillStyle = p.mid;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-20 + i * 80, 148, 48, 0, Math.PI * 2); ctx.fill(); }
    // Bushes
    ctx.fillStyle = p.acc;
    ctx.beginPath(); ctx.arc(30, 160, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(50, 162, 8,  0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(280, 160, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(260, 163, 8,  0, Math.PI * 2); ctx.fill();
    // Fence posts
    ctx.fillStyle = '#c8a96e';
    for (let i = 0; i < 8; i++) ctx.fillRect(40 + i * 35, 130, 3, 18);
    ctx.fillStyle = 'rgba(200,169,110,0.6)';
    for (let i = 0; i < 28; i++) ctx.fillRect(40 + i * 9, 134, 5, 1);
  }

  _sportsHall(ctx, p) {
    ctx.fillStyle = p.mid; ctx.fillRect(0, 0, 320, 240);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(255,255,255,0.18)`; ctx.fillRect(0, i * 14, 320, 1);
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0)'; ctx.fillRect(0, i * 14 + 1, 320, 12);
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#fffff0'; ctx.fillRect(30 + i * 70, 0, 50, 6);
      ctx.fillStyle = p.acc;    ctx.fillRect(30 + i * 70, 6, 50, 2);
    }
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(110, 8, 100, 30);
    ctx.strokeStyle = p.acc; ctx.lineWidth = 1; ctx.strokeRect(110, 8, 100, 30);
    ctx.fillStyle = p.acc; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('DINKBALL', 160, 28);
  }

  _carPark(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 90);
    ctx.fillStyle = p.mid; ctx.fillRect(0, 90, 320, 150);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, 100 + i * 24); ctx.lineTo(320, 104 + i * 20); ctx.stroke();
    }
    this._pixelCar(ctx, 20, 108, p.acc);
    this._pixelCar(ctx, 250, 108, p.acc);
    for (let i = 0; i < 2; i++) {
      const lx = 60 + i * 200;
      ctx.fillStyle = '#aaaaaa'; ctx.fillRect(lx, 60, 4, 60); ctx.fillRect(lx - 10, 58, 24, 6);
      ctx.fillStyle = 'rgba(255,253,224,0.9)'; ctx.beginPath(); ctx.arc(lx + 2, 60, 5, 0, Math.PI * 2); ctx.fill();
    }
  }

  _pixelCar(ctx, px, py, col) {
    ctx.fillStyle = col;  ctx.fillRect(px, py + 8, 50, 14);
    ctx.fillStyle = col;  ctx.fillRect(px + 8, py, 32, 12);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(px + 10, py + 22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(px + 40, py + 22, 5, 0, Math.PI * 2); ctx.fill();
  }

  _rooftop(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = p.mid; ctx.fillRect(0, 80, 320, 160);
    const r = rng(42);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const a = r() * 0.6 + 0.4;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(r() * 320, r() * 70, r() + 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const buildings = [[10,55,28,80],[45,40,20,80],[72,62,18,80],[96,30,30,80],[133,50,22,80],
                       [162,20,26,80],[195,45,18,80],[220,35,32,80],[260,52,24,80],[291,38,30,80]];
    ctx.fillStyle = '#0a1a2e';
    for (const b of buildings) ctx.fillRect(b[0], b[1], b[2], b[3]);
    const r2 = rng(42);
    for (const b of buildings) {
      for (let wy = 0; wy < 3; wy++) {
        for (let wx = 0; wx < Math.floor(b[2] / 8); wx++) {
          if (r2() > 0.45) { ctx.fillStyle = p.acc; ctx.fillRect(b[0]+2+wx*8, b[1]+4+wy*10, 4, 5); }
        }
      }
    }
    ctx.fillStyle = '#5a7a9a';
    for (let i = 0; i < 40; i++) ctx.fillRect(i * 8, 76, 2, 8);
    ctx.fillRect(0, 75, 320, 2);
  }

  _beach(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 100);
    ctx.fillStyle = '#2980b9'; ctx.fillRect(0, 85, 320, 40);
    ctx.strokeStyle = 'rgba(93,173,226,0.6)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(0, 90 + i * 12); ctx.lineTo(320, 92 + i * 12); ctx.stroke();
    }
    ctx.fillStyle = p.mid; ctx.fillRect(0, 120, 320, 120);
    ctx.fillStyle = p.acc; ctx.beginPath(); ctx.arc(40, 25, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b6914'; ctx.fillRect(18, 80, 5, 60);
    ctx.fillStyle = 'rgba(46,204,113,0.7)'; ctx.beginPath(); ctx.arc(22, 75, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(39,174,96,0.7)';  ctx.beginPath(); ctx.arc(12, 68, 12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(34, 70, 14, 0, Math.PI*2); ctx.fill();
  }

  _indoorArena(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = p.mid; ctx.fillRect(0, 150, 320, 90);
    for (let row = 0; row < 4; row++) {
      const r = rng(row * 13 + 7);
      for (let i = 0; i < 24; i++) {
        const hx = i * 14 + (r() - 0.5) * 6;
        ctx.fillStyle = `rgba(26,10,46,${0.7 + row * 0.05})`;
        ctx.beginPath(); ctx.arc(hx, 20 + row * 28 + (r() - 0.5) * 6, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (let i = 0; i < 3; i++) {
      const lx = 60 + i * 100;
      ctx.strokeStyle = 'rgba(255,255,200,0.15)'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx - 30 + i * 30, 140); ctx.stroke();
      ctx.fillStyle = '#fffde0'; ctx.beginPath(); ctx.arc(lx, 4, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = p.acc; ctx.fillRect(0, 150, 320, 2);
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(90, 2, 140, 16);
    ctx.strokeStyle = p.acc; ctx.lineWidth = 1; ctx.strokeRect(90, 2, 140, 16);
    ctx.fillStyle = p.acc; ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('DINKBALL ARENA', 160, 14);
  }

  _nationalStadium(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = p.mid; ctx.fillRect(0, 130, 320, 110);
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i < 40; i++) {
        const r = rng(row * 100 + i);
        ctx.fillStyle = `rgb(${Math.floor(r()*120+26)},${Math.floor(r()*50)},${Math.floor(r()*120+76)})`;
        ctx.fillRect(i * 8, 10 + row * 22, 7, 14);
      }
    }
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(160, 0, 200, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = p.acc; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(160, 0, 205, 0, Math.PI); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const fx = 40 + i * 80;
      ctx.fillStyle = '#cccccc'; ctx.fillRect(fx - 1, 0, 3, 30);
      ctx.fillStyle = '#fffde0'; ctx.beginPath(); ctx.arc(fx, 30, 5, 0, Math.PI*2); ctx.fill();
    }
  }

  _grandFinal(ctx, p) {
    ctx.fillStyle = p.sky; ctx.fillRect(0, 0, 320, 240);
    for (let row = 0; row < 6; row++) {
      const a = 0.5 - row * 0.06;
      ctx.fillStyle = `rgba(200,20,20,${a})`;
      ctx.fillRect(0, 8 + row * 18, 320, 14);
    }
    ctx.fillStyle = '#1a0000'; ctx.fillRect(40, 120, 240, 20);
    ctx.strokeStyle = p.acc; ctx.lineWidth = 1; ctx.strokeRect(40, 120, 240, 20);
    ctx.fillStyle = p.acc; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('GRAND FINAL', 160, 134);
    for (let i = 0; i < 5; i++) {
      const lx = 30 + i * 65;
      ctx.strokeStyle = `rgba(255,100,0,${0.07 + i * 0.01})`; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(160, 200); ctx.stroke();
      ctx.fillStyle = '#fffde0'; ctx.beginPath(); ctx.arc(lx, 3, 5, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = p.acc; ctx.fillRect(0, 198, 320, 2);
  }
}
