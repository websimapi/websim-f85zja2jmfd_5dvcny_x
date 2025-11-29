export function drawPlayerModel(game) {
    const ctx = game.ctx;
    const player = game.player;
    const x = 100;
    const baseY = 300;
    const crouch = player.getCrouchFactor();
    const y = baseY + crouch * 14 + player.getBreathingOffset();
    const aim = player.getAimAngle();
    const recoil = player.getRecoilOffset();
    const sway = player.walkSway * 0.6;

    ctx.save();
    ctx.translate(x + sway, y);

    // soft shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 38, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // torso
    const torsoW = 42;
    const torsoH = 40 - crouch * 8;
    const torsoBase = player.invulnerable && Math.floor(Date.now() / 120) % 2 ? '#7d8ba1' : '#3b4a5c';
    const g = ctx.createLinearGradient(0, -torsoH/2, 0, torsoH/2);
    g.addColorStop(0, shade(torsoBase, 0.18));
    g.addColorStop(0.5, shade(torsoBase, 0.02));
    g.addColorStop(1, shade(torsoBase, -0.10));
    ctx.fillStyle = g;
    roundRect(ctx, -torsoW/2, -torsoH/2, torsoW, torsoH, 6);
    ctx.fill();

    // chest plate / vest for more realism
    ctx.fillStyle = shade(torsoBase, -0.18);
    roundRect(ctx, -torsoW/2 + 3, -torsoH/2 + 4, torsoW - 6, torsoH * 0.55, 5);
    ctx.fill();
    // small mag pouches
    ctx.fillStyle = shade(torsoBase, 0.12);
    const pouchW = 8;
    for (let i = -1; i <= 1; i++) {
        roundRect(ctx, i * (pouchW + 2) - pouchW/2, -2, pouchW, 10, 2);
        ctx.fill();
    }

    // belt
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-torsoW/2, torsoH/2 - 6, torsoW, 8);
    ctx.fillStyle = '#cfcfcf';
    ctx.fillRect(-6, torsoH/2 - 4, 12, 4);

    // pelvis / hips
    ctx.fillStyle = '#26292d';
    ctx.fillRect(-18, torsoH/2 - 2, 36, 10);

    // neck
    ctx.save();
    const neckH = 8;
    ctx.translate(0, -torsoH/2 - neckH + 2 + crouch * 4);
    ctx.fillStyle = '#3b3330';
    roundRect(ctx, -6, -neckH, 12, neckH, 3);
    ctx.fill();
    ctx.restore();

    // head (slight aim rotation, facial features)
    ctx.save();
    const headBob = Math.sin(player.breathingTimer * 1.1) * (player.isCrouching ? 0.3 : 0.9);
    ctx.translate(
        4 * Math.sin(aim * 0.6),
        -torsoH/2 - 18 + crouch * 6 + player.getBreathingOffset() * 0.25 + headBob
    );
    ctx.rotate(aim * 0.22);
    const hw = 22, hh = 20;
    const skinBase = '#3e352f';
    const hg = ctx.createLinearGradient(-hw/2, -hh, hw/2, hh);
    hg.addColorStop(0, shade(skinBase, 0.10));
    hg.addColorStop(0.4, skinBase);
    hg.addColorStop(1, shade(skinBase, -0.04));
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(0, -hh/2, hw/2, hh/2, 0, 0, Math.PI*2);
    ctx.fill();

    // jaw / chin
    ctx.fillStyle = shade(skinBase, -0.08);
    roundRect(ctx, -hw/2 + 4, -hh/2 + 6, hw - 8, 6, 3);
    ctx.fill();

    // eyes
    ctx.fillStyle = '#f4f4f4';
    const eyeY = -hh + 8;
    ctx.fillRect(-6, eyeY, 5, 4);
    ctx.fillRect(1, eyeY, 5, 4);
    ctx.fillStyle = '#202020';
    ctx.fillRect(-4, eyeY + 1, 2, 2);
    ctx.fillRect(3, eyeY + 1, 2, 2);

    // eyebrows
    ctx.fillStyle = '#25211f';
    ctx.fillRect(-6, eyeY - 2, 5, 1);
    ctx.fillRect(1, eyeY - 2, 5, 1);

    // nose
    ctx.fillStyle = shade(skinBase, -0.12);
    ctx.fillRect(-1, eyeY + 4, 2, 4);

    // mouth
    ctx.fillStyle = '#241918';
    ctx.fillRect(-4, eyeY + 9, 8, 2);

    // simple ear
    ctx.fillStyle = shade(skinBase, -0.04);
    ctx.beginPath();
    ctx.ellipse(hw/2 - 3, -hh/2 + 4, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // hair / helmet band
    ctx.fillStyle = '#2b2b2b';
    roundRect(ctx, -hw/2, -hh + 2, hw, 6, 3);
    ctx.fill();

    ctx.restore();

    // left supporting arm (off-hand)
    ctx.save();
    ctx.translate(-torsoW/2 + 6, -torsoH/2 + 8 + crouch * 2 + player.getBreathingOffset() * 0.12);
    const idleArmSway = Math.sin(Date.now()*0.003) * 0.10;
    ctx.rotate(idleArmSway - 0.2 * (1 - crouch));
    ctx.fillStyle = '#3d4a5a';
    roundRect(ctx, -6, -6, 12, 22, 4);
    ctx.fill();
    ctx.translate(0, 14);
    ctx.rotate(0.08);
    ctx.fillRect(-5, -6, 10, 18);
    ctx.restore();

    // right arm + gun (dominant)
    ctx.save();
    ctx.translate(torsoW/2 - 6 + sway * 0.5, -torsoH/2 + 8 + crouch * 2 + player.getBreathingOffset() * 0.12);
    const reloadProg = player.reloading ? Math.min(1, player.reloadTime / Math.max(1, player.reloadDuration)) : 0;
    const reloadAngle = player.reloading ? Math.sin(reloadProg * Math.PI) * -0.9 : 0;
    ctx.rotate(aim + (-player.recoilTimer * 0.008) + reloadAngle);

    // upper arm
    ctx.fillStyle = '#3d4a5a';
    roundRect(ctx, 0, -6, 12, 22, 4);
    ctx.fill();

    // forearm
    ctx.translate(10, 8);
    ctx.rotate(-0.06 + (player.recoilTimer * -0.002));
    ctx.fillRect(0, -6, 28, 12);

    // glove
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(22, -5, 8, 10);

    // gun
    ctx.save();
    const reloadOffsetX = player.reloading ? -10 * Math.sin(reloadProg * Math.PI) : 0;
    const gunX = 20 + recoil * 0.5 + reloadOffsetX;
    const gunY = player.reloading ? 5 * Math.sin(reloadProg * Math.PI) : 0;
    ctx.translate(gunX, gunY);

    // realistic HD gun: layered body, stock, grip, barrel and sights
    const gunLength = 56 - recoil * 0.8;
    const gunHeight = 12;

    // main body gradient
    const bodyGrad = ctx.createLinearGradient(0, -gunHeight / 2, 0, gunHeight / 2);
    bodyGrad.addColorStop(0, '#7a7a7a');
    bodyGrad.addColorStop(0.4, '#515151');
    bodyGrad.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, -6, -gunHeight / 2, gunLength, gunHeight, 3);
    ctx.fill();

    // upper rail
    ctx.fillStyle = '#181d22';
    roundRect(ctx, -2, -gunHeight / 2 - 3, gunLength * 0.6, 4, 2);
    ctx.fill();

    // stock / shoulder pad
    const stockGrad = ctx.createLinearGradient(-12, 0, 6, 0);
    stockGrad.addColorStop(0, '#1a1a1a');
    stockGrad.addColorStop(1, '#303030');
    ctx.fillStyle = stockGrad;
    roundRect(ctx, -16, -4, 12, 14, 3);
    ctx.fill();

    // pistol grip
    ctx.save();
    ctx.translate(6, 6);
    ctx.rotate(0.8);
    const gripGrad = ctx.createLinearGradient(0, -6, 0, 10);
    gripGrad.addColorStop(0, '#242424');
    gripGrad.addColorStop(1, '#151515');
    ctx.fillStyle = gripGrad;
    roundRect(ctx, -4, -6, 8, 14, 3);
    ctx.fill();
    ctx.restore();

    // trigger guard
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 1);
    ctx.quadraticCurveTo(12, 6, 18, 2);
    ctx.stroke();

    // barrel extension
    ctx.fillStyle = '#a0a0a0';
    roundRect(ctx, gunLength - 2, -3, 12, 6, 2);
    ctx.fill();

    // front sight
    ctx.fillStyle = '#151515';
    ctx.fillRect(gunLength - 6, -gunHeight / 2 - 5, 4, 6);

    // rear sight
    ctx.fillRect(4, -gunHeight / 2 - 4, 6, 5);

    // subtle highlight along top
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -4, -gunHeight / 2 + 1, gunLength * 0.8, 3, 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // muzzle flash when recently fired
    if (player.recoilTimer > 8) {
        ctx.fillStyle = '#fff8b0';
        ctx.beginPath();
        ctx.ellipse(gunLength + 10, 0, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(220,200,140,0.5)';
        ctx.beginPath();
        ctx.ellipse(gunLength + 16, -2, 13, 9, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // chambered shell visual when reloading
    if (player.reloading) {
        ctx.fillStyle = '#c7a04b';
        ctx.beginPath();
        ctx.ellipse(26 + reloadOffsetX, -2 + gunY, 4, 3, 0, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore(); // gun
    ctx.restore(); // right arm

    // legs using game's helper for natural motion
    game.drawLegs(torsoH, crouch, player.getBreathingOffset(), sway);

    // chest breathing highlight
    ctx.save();
    ctx.globalAlpha = 0.10 + Math.abs(Math.sin(player.breathingTimer)) * 0.06;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -10, -6, 20, 10, 4);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // small helpers (local)
    function roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w/2, h/2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function shade(hex, percent) {
        try {
            const c = hex.replace('#','');  
            const num = parseInt(c,16);
            let r = (num >> 16) + Math.round(255 * percent);
            let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
            let b = (num & 0x0000FF) + Math.round(255 * percent);
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            return '#' + ( (1<<24) + (r<<16) + (g<<8) + b ).toString(16).slice(1);
        } catch (e) {
            return hex;
        }
    }
}