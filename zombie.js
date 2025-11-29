export class Zombie {
    constructor(x, y, speed, type = 'normal', health = 1) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.type = type;
        // Sizes/health vary by type for visual and gameplay variety
        switch (type) {
            case 'runner':
                this.width = 32;
                this.height = 44;
                break;
            case 'crawler':
                this.width = 36;
                this.height = 28;
                break;
            case 'spitter':
                this.width = 40;
                this.height = 60;
                break;
            case 'exploder':
            case 'bloater':
                this.width = 60;
                this.height = 70;
                break;
            case 'tank':
                this.width = 60;
                this.height = 80;
                break;
            case 'armored':
                this.width = 48;
                this.height = 66;
                break;
            case 'healer':
                this.width = 38;
                this.height = 58;
                break;
            case 'screecher':
                this.width = 40;
                this.height = 62;
                break;
            case 'brute':
                this.width = 80;
                this.height = 90;
                break;
            case 'necromancer':
                this.width = 64;
                this.height = 84;
                break;
            // New variants sizes
            case 'phaser':
                this.width = 42;
                this.height = 56;
                break;
            case 'leaper':
                this.width = 34;
                this.height = 46;
                break;
            case 'mimic':
                this.width = 40;
                this.height = 58;
                break;
            case 'frost':
                this.width = 46;
                this.height = 60;
                break;
            case 'electro':
                this.width = 44;
                this.height = 60;
                break;
            case 'swarm':
                this.width = 30;
                this.height = 40;
                break;
            case 'razor':
                this.width = 38;
                this.height = 54;
                break;
            case 'ghost':
                this.width = 36;
                this.height = 52;
                break;
            case 'juggernaut':
                this.width = 68;
                this.height = 86;
                break;
            case 'bomber':
                this.width = 40;
                this.height = 56;
                break;
            case 'behemoth':
                this.width = 140;
                this.height = 170;
                break;
            default:
                this.width = 40;
                this.height = 60;
        }

        this.health = health;
        this.maxHealth = health;
        
        // Attach readable pros/cons metadata for this zombie type
        const traits = this.getTypeTraits(type);
        this.pros = traits.pros;
        this.cons = traits.cons;
        
        // Animation properties
        this.animationFrame = 0;
        // runners animate faster, tank slower
        this.animationSpeed = (type === 'runner') ? 0.6 : (type === 'tank') ? 0.12 : 0.2;
        
        // Realistic additions
        this.staggerTimer = 0;
        this.limpTimer = 0;
        this.limpSpeed = speed * (0.7 + Math.random() * 0.3);
        this.bloodTrail = [];
        this.lastBloodDrop = 0;

        // Movement physics for more realistic behavior
        this.vx = 0;
        this.vy = 0;
        this.direction = Math.random() * Math.PI * 2;
        this.wobbleTimer = Math.random() * 100;

        // behavior flags for new types
        this.canSpit = (type === 'spitter');
        this.spitTimer = 0;
        this.isCrawler = (type === 'crawler');
        this.isRunner = (type === 'runner');
        this.isExploder = (type === 'exploder' || type === 'bloater');

        // New special behaviors
        this.isArmored = (type === 'armored');
        this.armor = this.isArmored ? 2 : 0; // reduces incoming damage by armor value
        this.isHealer = (type === 'healer');
        this.healTimer = 0;
        this.isScreecher = (type === 'screecher');
        this.screechTimer = 0;
        this.isBrute = (type === 'brute');
        this.isNecromancer = (type === 'necromancer');
        this.summonTimer = 0;

        // New special flags
        this.isStalker = (type === 'stalker');
        this.isAcid = (type === 'acid');
        this.isMutant = (type === 'mutant');
        this.isVomiter = (type === 'vomiter');
        this.isShielder = (type === 'shielder');
        this.isKamikaze = (type === 'kamikaze');
        this.isPhaser = (type === 'phaser');
        this.isLeaper = (type === 'leaper');
        this.isMimic = (type === 'mimic');
        this.isFrost = (type === 'frost');
        this.isElectro = (type === 'electro');
        this.isSwarm = (type === 'swarm');
        this.isRazor = (type === 'razor');
        this.isGhost = (type === 'ghost');
        this.isJuggernaut = (type === 'juggernaut');
        this.isBomber = (type === 'bomber');
        this.isBehemoth = (type === 'behemoth');

        // Boss scaling flags
        this.isBoss = (type === 'brute' || type === 'necromancer');

        // Visual special timers
        this.glowTimer = 0;
    }

    update() {
        // Stagger effect reduces speed
        const currentSpeed = this.staggerTimer > 0 ? this.speed * 0.3 : this.speed;
        
        // apply small natural speed variance and wobble
        this.wobbleTimer += 0.02;
        const wobble = Math.sin(this.wobbleTimer + this.x * 0.01) * 0.06;
        // adjust movement for crawlers (slow low profile) and runners (faster gait)
        const speedFactor = this.isCrawler ? 0.5 : this.isRunner ? 1.6 : 1;

        // update velocity based movement so we can do avoidance and smoothing
        this.vx += Math.cos(this.direction + wobble) * (currentSpeed * 0.05 * speedFactor);
        this.vy += Math.sin(this.direction + wobble) * (currentSpeed * 0.05 * speedFactor);
        // damping for smoother motion
        this.vx *= 0.92;
        this.vy *= 0.92;
        this.x += this.vx;
        this.y += this.vy;
        
        // Emit small ambient particles (dust, blood drips, sparks, acid) for visual variety
        if (this.gameRef && this.gameRef.particleSystem && Math.random() < 0.025) {
            const ps = this.gameRef.particleSystem;
            const baseColor = this.getColor();
            const particle = {
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + this.height / 2 + 2,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -Math.random() * 0.6,
                life: 30 + Math.random() * 30,
                maxLife: 30 + Math.random() * 30,
                color: this.health < this.maxHealth ? '#6B0000' : baseColor,
                size: Math.random() * 3 + 1,
                type: this.isAcid ? 'acid' : (this.isElectro ? 'spark' : (this.health < this.maxHealth ? 'blood' : 'dust'))
            };
            ps.particles.push(particle);
        }
        
        this.animationFrame += this.animationSpeed;
        
        // Add limping for damaged zombies
        if (this.health < this.maxHealth && this.type !== 'tank') {
            this.limpTimer += 0.1;
            this.y += Math.sin(this.limpTimer) * 0.8;
        }
        
        // Blood trail for damaged zombies
        if (this.health < this.maxHealth && Date.now() - this.lastBloodDrop > 500) {
            this.bloodTrail.push({
                x: this.x,
                y: this.y,
                life: 120,
                maxLife: 120
            });
            this.lastBloodDrop = Date.now();
        }
        
        // Update blood trail
        this.bloodTrail = this.bloodTrail.filter(drop => {
            drop.life--;
            return drop.life > 0;
        });

        // Spitter behavior: cooldown tick (actual projectile handled elsewhere if desired)
        if (this.canSpit) {
            this.spitTimer++;
            if (this.spitTimer > 180) {
                this.spitTimer = 0;
                // visual twitch when about to spit
                this.wobbleTimer += 1.2;
            }
        }

        // Armored: occasional flinch reduction (visual)
        if (this.isArmored) {
            this.glowTimer += 0.04;
        }

        // Healer: periodically heal nearby zombies
        if (this.isHealer) {
            this.healTimer++;
            if (this.healTimer >= 120) { // every 2 seconds
                this.healTimer = 0;
                this.emitHealPulse();
            }
        }

        // Stalker: occasionally drain small stamina when near player (handled in Game collision)
        if (this.isStalker && this.gameRef && this.gameRef.player) {
            // visual cue: subtle invis/wobble
            this.wobbleTimer += 0.02;
        }

        // Acid: leave a small visual acid trail that can apply DOT (visual-only here)
        if (this.isAcid && Math.random() < 0.02 && this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.particles.push({
                x: this.x + (Math.random()-0.5)*8,
                y: this.y + (Math.random()-0.5)*8,
                vx: 0,
                vy: 0,
                life: 80,
                maxLife: 80,
                color: 'rgba(80,255,120,0.12)',
                size: Math.random()*6+4,
                type: 'acid'
            });
        }

        // Mutant: tougher, occasionally emits a radial stagger pulse
        if (this.isMutant && Math.random() < 0.001 && this.gameRef) {
            for (let z of this.gameRef.zombies) {
                const d = Math.hypot(z.x - this.x, z.y - this.y);
                if (d < 80) z.staggerTimer = Math.max(z.staggerTimer, 10);
            }
        }

        // Screecher: emits a stun/sound pulse occasionally
        if (this.isScreecher) {
            this.screechTimer++;
            if (this.screechTimer >= 200) {
                this.screechTimer = 0;
                this.emitScreech();
            }
        }

        // Boss behaviors
        if (this.isNecromancer) {
            this.summonTimer++;
            if (this.summonTimer >= 300) {
                this.summonTimer = 0;
                this.summonMinion();
            }
        } else if (this.isBrute) {
            // Brute charges intermittently
            if (Math.random() < 0.005) {
                this.vx *= 3;
                this.vy *= 3;
                this.staggerTimer = 0;
            }
        }

        // Vomiter: occasionally puke which creates messy particles
        if (this.isVomiter && this.gameRef && Math.random() < 0.006) {
            // puke particle burst (visual, small area annoyance)
            if (this.gameRef && this.gameRef.particleSystem) {
                for (let i = 0; i < 10; i++) {
                    this.gameRef.particleSystem.particles.push({
                        x: this.x + (Math.random()-0.5)*12,
                        y: this.y + (Math.random()-0.5)*12,
                        vx: (Math.random()-0.5)*1,
                        vy: (Math.random()-0.5)*1,
                        life: 60,
                        maxLife: 60,
                        color: 'rgba(160,200,60,0.6)',
                        size: Math.random()*6+4,
                        type: 'vomit'
                    });
                }
                this.gameRef.particleSystem.createFloatingText(this.x, this.y - 20, 'PUKE', '#a0c83c');
            }
        }

        // Shielder: passive armor/shield pulse visual
        if (this.isShielder) {
            this.glowTimer += 0.05;
            if (this.gameRef && this.gameRef.particleSystem && Math.random() < 0.002) {
                this.gameRef.particleSystem.createFloatingText(this.x, this.y - 30, 'SHIELD', '#88d0ff');
            }
        }

        // Kamikaze: when very close to player, trigger self-stagger/explosion intent (handled in Game on collision)
        if (this.isKamikaze) {
            // small visual twitch occasionally
            if (Math.random() < 0.01 && this.gameRef && this.gameRef.particleSystem) {
                this.gameRef.particleSystem.createFloatingText(this.x, this.y - 10, '!*', '#ffcc66');
            }
        }

        // Phaser: occasional short teleport to nearby location
        if (this.isPhaser && Math.random() < 0.002) {
            this.x += (Math.random() - 0.5) * 80;
            this.y += (Math.random() - 0.5) * 40;
            if (this.gameRef && this.gameRef.particleSystem) this.gameRef.particleSystem.createFloatingText(this.x, this.y - 10, 'PHASE', '#88ccff');
        }

        // Leaper: occasional leap toward player
        if (this.isLeaper && this.gameRef && Math.random() < 0.006) {
            const px = this.gameRef.player ? 100 : 0;
            const py = this.gameRef.player ? 300 : 0;
            const dx = px - this.x;
            const dy = py - this.y;
            const d = Math.hypot(dx, dy) || 1;
            this.vx += (dx / d) * 6;
            this.vy += (dy / d) * 4;
        }

        // Mimic: brief invis/ambush visual cue (handled by slight wobble)
        if (this.isMimic && Math.random() < 0.003) {
            if (this.gameRef && this.gameRef.particleSystem) this.gameRef.particleSystem.createFloatingText(this.x, this.y - 10, 'AMBUSH', '#ffcc88');
            this.wobbleTimer += 1.5;
        }

        // Frost: occasional slow pulse (reduces player stamina slightly when near)
        if (this.isFrost && this.gameRef && this.gameRef.player) {
            if (Math.hypot(this.x - this.gameRef.playerX, this.y - 300) < 60 && Math.random() < 0.004) {
                this.gameRef.player.stamina = Math.max(0, this.gameRef.player.stamina - 8);
                if (this.gameRef.particleSystem) this.gameRef.particleSystem.createFloatingText(this.x, this.y - 10, 'FREEZE', '#cceeff');
            }
        }

        // Electro: occasional stun pulse reduces player stamina and staggers nearby zombies
        if (this.isElectro && Math.random() < 0.0025 && this.gameRef) {
            for (let z of this.gameRef.zombies) {
                const d = Math.hypot(z.x - this.x, z.y - this.y);
                if (d < 80) z.staggerTimer = Math.max(z.staggerTimer, 8);
            }
            if (this.gameRef.player) this.gameRef.player.stamina = Math.max(0, this.gameRef.player.stamina - 6);
            if (this.gameRef.particleSystem) this.gameRef.particleSystem.createFloatingText(this.x, this.y - 10, 'ZAP', '#aaffff');
        }

        // Ghost: subtle extra wobble (visual makes them feel less solid)
        if (this.isGhost) {
            this.wobbleTimer += 0.05;
        }

        // Swarm, razor, bomber minimal visual behaviors
        if (this.isSwarm && Math.random() < 0.004 && this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.createFloatingText(this.x, this.y - 6, 'SWARM', '#ffd27a');
        }
        if (this.isRazor && Math.random() < 0.003 && this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.createFloatingText(this.x, this.y - 6, 'RAZE', '#ff7777');
        }
        if (this.isBomber && Math.random() < 0.002 && this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.particles.push({
                x: this.x + (Math.random()-0.5)*6,
                y: this.y + (Math.random()-0.5)*6,
                vx: (Math.random()-0.5)*2,
                vy: -1,
                life: 40,
                maxLife: 40,
                color: '#ffcc66',
                size: 6,
                type: 'smoke'
            });
        }

        // Behemoth: strong boss behavior - heavy wobble and rare shockwave staggering nearby
        if (this.isBehemoth && Math.random() < 0.0015 && this.gameRef) {
            for (let z of this.gameRef.zombies) {
                const d = Math.hypot(z.x - this.x, z.y - this.y);
                if (d < 160) z.staggerTimer = Math.max(z.staggerTimer, 12);
            }
            if (this.gameRef.particleSystem) this.gameRef.particleSystem.createFloatingText(this.x, this.y - 30, 'BEHEMOTH', '#ff4444');
        }
    }

    // Healer pulse: heal small nearby zombies
    emitHealPulse() {
        if (!this.gameRef) return;
        // create soft glow/particles by using particleSystem if available
        if (this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.createFloatingText(this.x, this.y - 20, 'HEAL', '#88ff88');
        }
        for (let z of this.gameRef.zombies) {
            const d = Math.hypot(z.x - this.x, z.y - this.y);
            if (d < 80 && z.health > 0 && z.health < z.maxHealth) {
                z.health = Math.min(z.maxHealth, z.health + 1);
            }
        }
    }

    // Screecher: apply short stagger to player and nearby zombies get louder (visual cue)
    emitScreech() {
        if (!this.gameRef) return;
        // visual hint
        if (this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.createFloatingText(this.x, this.y - 20, 'SCREECH!', '#ff77ff');
        }
        // small stun on player (reduce stamina or cause slight invul toggle)
        if (this.gameRef && this.gameRef.player) {
            this.gameRef.player.stamina = Math.max(0, this.gameRef.player.stamina - 10);
        }
        // briefly increase wobble for nearby zombies making them surge
        for (let z of this.gameRef.zombies) {
            const d = Math.hypot(z.x - this.x, z.y - this.y);
            if (d < 120) {
                z.wobbleTimer += 1.2;
            }
        }
    }

    // Necromancer: summon a weak minion near itself
    summonMinion() {
        if (!this.gameRef) return;
        const x = this.x + (Math.random() - 0.5) * 30;
        const y = this.y + (Math.random() - 0.5) * 30;
        // small minion has lesser health and speed
        const minion = new Zombie(x, y, this.speed * 1.1, 'fast', 1);
        // give reference to game for behaviors
        minion.gameRef = this.gameRef;
        this.gameRef.zombies.push(minion);
        if (this.gameRef && this.gameRef.particleSystem) {
            this.gameRef.particleSystem.createFloatingText(x, y - 10, 'MINION', '#ffcc66');
        }
    }

    // drawing updated to show variety / special cues
    draw(ctx) {
        const color = this.getColor();

        // Draw blood trail first (on world coordinates)
        this.bloodTrail.forEach(drop => {
            const alpha = drop.life / drop.maxLife;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Cache some common values
        const isCrawler = this.isCrawler;
        const isRunner = this.isRunner;
        const isBoss = this.isBoss || this.isBehemoth;
        const baseBodyHeight = isCrawler ? this.height * 0.6 : this.height * 0.8;
        const baseBodyWidth = isRunner ? this.width * 0.7 : isCrawler ? this.width : this.width * 0.85;

        // Shadow under feet
        ctx.save();
        ctx.translate(this.x, this.y);
        const shadowScale = isCrawler ? 0.7 : 1;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, baseBodyHeight * 0.45, (this.width * 0.6) * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body origin is at middle of torso, a bit above geometric center
        const torsoH = baseBodyHeight * (isCrawler ? 0.55 : 0.65);
        const torsoW = baseBodyWidth;
        const torsoY = isCrawler ? -torsoH * 0.25 : -torsoH * 0.1;

        // Slight sway / breathing
        const sway = Math.sin(this.animationFrame * (isRunner ? 0.7 : 0.45)) * (isCrawler ? 2 : 3);
        const bob = Math.sin(this.animationFrame * 0.3) * (isRunner ? 2 : 1.5);

        ctx.translate(0, bob);

        // Torso with simple vertical shading
        const torsoGrad = ctx.createLinearGradient(0, torsoY - torsoH / 2, 0, torsoY + torsoH / 2);
        torsoGrad.addColorStop(0, this._shade(color, 0.16));
        torsoGrad.addColorStop(0.5, color);
        torsoGrad.addColorStop(1, this._shade(color, -0.12));
        ctx.fillStyle = torsoGrad;
        this._roundRect(ctx, -torsoW / 2, torsoY - torsoH / 2, torsoW, torsoH, 6);
        ctx.fill();

        // Chest / ribcage accent
        ctx.fillStyle = this._shade(color, -0.18);
        this._roundRect(ctx, -torsoW / 2 + 4, torsoY - torsoH / 2 + 4, torsoW - 8, torsoH * 0.4, 4);
        ctx.fill();

        // Armored plating and boss plating
        if (this.isArmored || isBoss || this.isExploder || this.type === 'tank') {
            ctx.fillStyle = '#666a6f';
            this._roundRect(ctx, -torsoW / 2 + 2, torsoY - torsoH * 0.1, torsoW - 4, 10, 4);
            ctx.fill();

            // small rivets
            ctx.fillStyle = '#444';
            for (let i = -1; i <= 1; i++) {
                ctx.fillRect(i * (torsoW / 4) - 2, torsoY - torsoH * 0.1 + 2, 4, 4);
            }
        }

        // Special belly / heavy armor for exploder / tank
        if (this.isExploder || this.type === 'tank' || this.isJuggernaut || this.isBehemoth) {
            ctx.fillStyle = this.getHeadColor();
            this._roundRect(ctx, -torsoW * 0.2, torsoY - torsoH * 0.1 + 8, torsoW * 0.4, torsoH * 0.35, 4);
            ctx.fill();
        }

        // Head positioning
        const headBaseColor = this.getHeadColor();
        const headW = this.type === 'tank' || this.isBehemoth ? torsoW * 0.85 : isRunner ? torsoW * 0.55 : torsoW * 0.7;
        const headH = this.type === 'tank' || this.isBehemoth ? torsoH * 0.8 : isRunner ? torsoH * 0.5 : torsoH * 0.65;
        const headOffsetY = torsoY - torsoH / 2 - headH * 0.55;

        // Head wobble/tilt
        const headTilt = Math.sin(this.animationFrame * (isRunner ? 0.6 : 0.35)) * (isCrawler ? 0.05 : 0.1);
        ctx.save();
        ctx.translate(sway * 0.5, headOffsetY + headH * 0.5);
        ctx.rotate(headTilt);
        ctx.translate(-headW / 2, -headH);

        // Head base with subtle shading
        const headGrad = ctx.createLinearGradient(0, 0, 0, headH);
        headGrad.addColorStop(0, this._shade(headBaseColor, 0.1));
        headGrad.addColorStop(0.4, headBaseColor);
        headGrad.addColorStop(1, this._shade(headBaseColor, -0.08));
        ctx.fillStyle = headGrad;
        this._roundRect(ctx, 0, 0, headW, headH, 4);
        ctx.fill();

        // Eyes
        const eyeSize = isRunner ? 4 : (this.type === 'tank' || this.isBehemoth) ? 8 : 6;
        const eyeY = headH * 0.35;
        const eyeSpacing = headW * 0.25;
        ctx.fillStyle = this.getEyeColor();
        ctx.globalAlpha = this.isExploder ? 0.9 : 0.75;
        ctx.fillRect(headW * 0.5 - eyeSpacing - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
        ctx.fillRect(headW * 0.5 + eyeSpacing - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
        ctx.globalAlpha = 1;

        // Mouth / jaw
        ctx.fillStyle = '#2b0000';
        const mouthW = headW * 0.5;
        const mouthH = headH * 0.18;
        ctx.fillRect(headW * 0.5 - mouthW / 2, headH * 0.7, mouthW, mouthH);

        // Simple teeth hints for brute/behemoth/tank
        if (this.isBrute || this.isBehemoth || this.type === 'tank') {
            ctx.fillStyle = '#f5f5f5';
            for (let i = -2; i <= 2; i++) {
                ctx.fillRect(headW * 0.5 + i * (mouthW / 6) - 1, headH * 0.7, 2, mouthH * 0.5);
            }
        }

        // Necromancer indicators (hat)
        if (this.isNecromancer) {
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(headW * 0.5 - headW * 0.35, -6, headW * 0.7, 6);
            ctx.beginPath();
            ctx.moveTo(headW * 0.5, -6 - headH * 0.3);
            ctx.lineTo(headW * 0.3, -6);
            ctx.lineTo(headW * 0.7, -6);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore(); // head

        // Arms with simple joints
        const armLength = isCrawler ? torsoH * 0.6 : torsoH * 0.9;
        const armWidth = isRunner ? 7 : 8;
        const armSwing = Math.sin(this.animationFrame) * (isRunner ? 14 : 10);
        const shoulderY = torsoY - torsoH * 0.1;

        ctx.fillStyle = this._shade(color, -0.04);

        // Left arm
        ctx.save();
        ctx.translate(-torsoW / 2 - 4, shoulderY);
        ctx.rotate((armSwing - 6) * 0.03);
        this._roundRect(ctx, -armWidth / 2, 0, armWidth, armLength, 4);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(torsoW / 2 + 4, shoulderY);
        ctx.rotate(-(armSwing - 6) * 0.03);
        this._roundRect(ctx, -armWidth / 2, 0, armWidth, armLength, 4);
        ctx.fill();
        ctx.restore();

        // Legs (simplified but with step animation)
        const legWidth = this.type === 'tank' || this.isBehemoth ? 11 : isCrawler ? 6 : 8;
        const legLength = isCrawler ? baseBodyHeight * 0.4 : baseBodyHeight * 0.6;
        const legOffsetY = torsoY + torsoH / 2;
        const legPhase = this.animationFrame * (isRunner ? 1.2 : 0.85);
        const legSwing = Math.sin(legPhase) * (isRunner ? 9 : 6);

        ctx.fillStyle = this._shade(color, -0.07);

        // Left leg
        ctx.save();
        ctx.translate(-legWidth - 2, legOffsetY);
        ctx.rotate(legSwing * 0.03);
        this._roundRect(ctx, -legWidth / 2, 0, legWidth, legLength, 3);
        ctx.fill();
        // Foot
        ctx.fillRect(-legWidth / 2 - 2, legLength - 2, legWidth + 6, 4);
        ctx.restore();

        // Right leg
        ctx.save();
        ctx.translate(legWidth + 2, legOffsetY);
        ctx.rotate(-legSwing * 0.03);
        this._roundRect(ctx, -legWidth / 2, 0, legWidth, legLength, 3);
        ctx.fill();
        ctx.fillRect(-legWidth / 2 - 2, legLength - 2, legWidth + 6, 4);
        ctx.restore();

        // Screecher visual: glowing throat
        if (this.isScreecher) {
            ctx.fillStyle = '#ff66ff';
            const glow = (Math.sin(this.animationFrame * 0.6) + 1) * 2;
            ctx.beginPath();
            ctx.ellipse(0, torsoY - torsoH * 0.1, 10 + glow, 5 + glow * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Healer halo above head
        if (this.isHealer) {
            ctx.strokeStyle = 'rgba(136,255,136,0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, headOffsetY - headH * 0.7, 18 + Math.sin(this.animationFrame * 0.3) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Brute / boss aura
        if (this.isBrute || this.isBehemoth) {
            ctx.strokeStyle = 'rgba(255,80,80,0.14)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(this.width, this.height) * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Vomiter splatter visual near feet
        if (this.isVomiter) {
            ctx.fillStyle = 'rgba(160,200,60,0.18)';
            ctx.beginPath();
            ctx.ellipse(0, baseBodyHeight * 0.45, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shielder visual: soft shield bubble
        if (this.isShielder) {
            ctx.strokeStyle = 'rgba(136,208,255,0.25)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(this.width, this.height) * 0.6 + Math.sin(this.glowTimer) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Kamikaze pulsing outline
        if (this.isKamikaze) {
            ctx.strokeStyle = 'rgba(255,140,60,0.26)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const pulse = (Math.sin(Date.now() * 0.02) + 1) * 2;
            ctx.arc(0, 0, Math.max(this.width, this.height) * 0.5 + pulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore(); // main translate/save

        // Health bar for tank/exploder and bosses (world coordinates above zombie)
        if ((this.type === 'tank' || this.isExploder || this.isBoss || this.isBehemoth) && this.health < this.maxHealth) {
            const barWidth = isBoss || this.isBehemoth ? 110 : 80;
            const barHeight = 8;
            const healthPercent = Math.max(0, this.health / this.maxHealth);
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 16;

            // Background
            ctx.fillStyle = '#222';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Health with gradient
            const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(healthPercent, '#00ff00');
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    // Helper to draw rounded rectangles for zombies
    _roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Helper to slightly lighten/darken colors
    _shade(hex, percent) {
        try {
            const c = hex.replace('#', '');
            const num = parseInt(c, 16);
            let r = (num >> 16) + Math.round(255 * percent);
            let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
            let b = (num & 0x0000FF) + Math.round(255 * percent);
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (e) {
            return hex;
        }
    }

    // New: describe per‑type gameplay pros & cons
    getTypeTraits(type) {
        switch (type) {
            case 'runner':
                return {
                    pros: ['Very fast', 'Hard to kite'],
                    cons: ['Low health', 'No special abilities']
                };
            case 'fast':
                return {
                    pros: ['Faster than normal', 'Closes gaps quickly'],
                    cons: ['Low health', 'No armor']
                };
            case 'normal':
                return {
                    pros: ['Balanced stats'],
                    cons: ['No special strengths', 'Easily outscaled later waves']
                };
            case 'crawler':
                return {
                    pros: ['Low profile target', 'Harder to hit at long range'],
                    cons: ['Very slow', 'Easy to outrun']
                };
            case 'spitter':
                return {
                    pros: ['Threatens from range', 'Can pressure you behind other zombies'],
                    cons: ['Slower movement', 'Weak in close range']
                };
            case 'exploder':
            case 'bloater':
                return {
                    pros: ['High burst damage when close', 'Soaks several hits'],
                    cons: ['Slow shuffle', 'Danger is obvious and telegraphed']
                };
            case 'tank':
                return {
                    pros: ['Very high health', 'Hits harder than most'],
                    cons: ['Very slow', 'Easy to focus fire'],
                };
            case 'armored':
                return {
                    pros: ['Reduces incoming damage', 'Stays dangerous under fire'],
                    cons: ['Slower than fast types', 'Vulnerable to bombs and AoE']
                };
            case 'healer':
                return {
                    pros: ['Heals nearby zombies', 'Keeps bosses alive longer'],
                    cons: ['Low to medium health', 'Killing it removes its whole advantage']
                };
            case 'screecher':
                return {
                    pros: ['Drains stamina with screech', 'Buffs nearby zombies briefly'],
                    cons: ['Fragile', 'Screech is highly telegraphed']
                };
            case 'brute':
                return {
                    pros: ['Boss-level health', 'Occasional charge bursts forward'],
                    cons: ['Very slow normally', 'Large hitbox makes it easy to hit']
                };
            case 'necromancer':
                return {
                    pros: ['Summons extra minions', 'Adds long-term pressure'],
                    cons: ['Moderate speed and health', 'Killing it ends the summons']
                };
            case 'stalker':
                return {
                    pros: ['Sneaky stamina drain near player', 'Moves a bit faster than normal'],
                    cons: ['Low health', 'Needs to get close to matter']
                };
            case 'acid':
                return {
                    pros: ['Leaves acid visuals and pressure zones', 'Moderate health'],
                    cons: ['Not very fast', 'Weak to burst damage']
                };
            case 'mutant':
                return {
                    pros: ['High health for its tier', 'Radial stagger pulse on nearby zombies'],
                    cons: ['Slower than average', 'Big body is easy to focus']
                };
            case 'vomiter':
                return {
                    pros: ['Creates puke zones that clutter the screen', 'Decent health'],
                    cons: ['Slow', 'Limited direct damage']
                };
            case 'shielder':
                return {
                    pros: ['Shield aura reduces damage', 'Makes nearby packs tankier'],
                    cons: ['Slow and predictable', 'Once isolated it is easy to kill']
                };
            case 'kamikaze':
                return {
                    pros: ['Very high contact damage burst', 'Moves quickly'],
                    cons: ['Extremely low health', 'One-time threat that disappears on hit']
                };
            case 'phaser':
                return {
                    pros: ['Short-range teleports to dodge fire', 'Harder to track'],
                    cons: ['Medium health', 'Teleports are short and somewhat random']
                };
            case 'leaper':
                return {
                    pros: ['Occasional long leap toward you', 'Great at breaking spacing'],
                    cons: ['Fragile', 'Predictable leap arcs']
                };
            case 'mimic':
                return {
                    pros: ['Ambush-style behavior', 'Harder to read in groups'],
                    cons: ['Only moderate health', 'No raw damage bonuses']
                };
            case 'frost':
                return {
                    pros: ['Can sap your stamina when close', 'Synergizes with other rushers'],
                    cons: ['Slow', 'Low to medium health']
                };
            case 'electro':
                return {
                    pros: ['Stun pulses stagger zombies and drain stamina', 'Disrupts your rhythm'],
                    cons: ['Moderate stats', 'Pulses are infrequent']
                };
            case 'swarm':
                return {
                    pros: ['Very fast swarm behavior', 'Arrives in numbers'],
                    cons: ['Very low health', 'Dies to any stray pellet']
                };
            case 'razor':
                return {
                    pros: ['High damage on contact feel', 'Keeps pressure in close range'],
                    cons: ['Medium health', 'No ranged tools or armor']
                };
            case 'ghost':
                return {
                    pros: ['Ghostly visuals make them less obvious', 'Decent speed'],
                    cons: ['Low health', 'No armor or burst damage']
                };
            case 'juggernaut':
                return {
                    pros: ['Heavy health pool', 'Feels like a mini-boss in lanes'],
                    cons: ['Very slow', 'Large profile makes dodging easy']
                };
            case 'bomber':
                return {
                    pros: ['Explosive visuals and pressure', 'Moves faster than tanks'],
                    cons: ['Low health', 'Loses threat once its burst is avoided']
                };
            case 'behemoth':
                return {
                    pros: ['Huge health and stagger auras', 'Terrifying presence on screen'],
                    cons: ['Extremely slow', 'Very large target for bombs and pellets']
                };
            default:
                return {
                    pros: ['Baseline zombie stats'],
                    cons: ['No special abilities']
                };
        }
    }

    getColor() {
        switch(this.type) {
            case 'fast':
            case 'runner': return '#ff6b6b';
            case 'tank': return '#8b4513';
            case 'spitter': return '#557733';
            case 'crawler': return '#505050';
            case 'exploder':
            case 'bloater': return '#6b2b2b';
            case 'armored': return '#4b5563';
            case 'healer': return '#6fe1a7';
            case 'screecher': return '#ff99ff';
            case 'brute': return '#6a0d0d';
            case 'necromancer': return '#4b2b6b';
            case 'stalker': return '#2f4f4f';
            case 'acid': return '#4cff9a';
            case 'mutant': return '#7b2b6b';
            case 'vomiter': return '#7a8b36';
            case 'shielder': return '#4f9fbf';
            case 'kamikaze': return '#ffb36b';
            case 'phaser': return '#7fdcff';
            case 'leaper': return '#ffb37f';
            case 'mimic': return '#d8bfa6';
            case 'frost': return '#cfeeff';
            case 'electro': return '#aaffee';
            case 'swarm': return '#ffd27a';
            case 'razor': return '#ff8a8a';
            case 'ghost': return '#7f8f9f';
            case 'juggernaut': return '#5a2f2f';
            case 'bomber': return '#ffcc99';
            case 'behemoth': return '#3b0b0b';
            default: return '#3a3a3a';
        }
    }

    getHeadColor() {
        switch(this.type) {
            case 'fast':
            case 'runner': return '#ff8888';
            case 'tank': return '#a0522d';
            case 'spitter': return '#6fa86f';
            case 'crawler': return '#3f3f3f';
            case 'exploder':
            case 'bloater': return '#8a3a3a';
            case 'armored': return '#7d848a';
            case 'healer': return '#b6f7d0';
            case 'screecher': return '#ffd0ff';
            case 'brute': return '#8f1a1a';
            case 'necromancer': return '#7e57c2';
            case 'stalker': return '#2a3b3b';
            case 'acid': return '#b9ffd9';
            case 'mutant': return '#9b4fa6';
            case 'vomiter': return '#c4d96a';
            case 'shielder': return '#a6d9ff';
            case 'kamikaze': return '#ffd9b3';
            case 'phaser': return '#bfefff';
            case 'leaper': return '#ffd9b3';
            case 'mimic': return '#e8d8c6';
            case 'frost': return '#e6fbff';
            case 'electro': return '#dfffe8';
            case 'swarm': return '#ffe6b3';
            case 'razor': return '#ffd6d6';
            case 'ghost': return '#b0c0c8';
            case 'juggernaut': return '#7b3b2b';
            case 'bomber': return '#ffe6cc';
            case 'behemoth': return '#5b1b1b';
            default: return '#4a4a4a';
        }
    }

    getEyeColor() {
        switch(this.type) {
            case 'fast':
            case 'runner': return '#ffff00';
            case 'tank': return '#ff0000';
            case 'spitter': return '#b3ffb3';
            case 'crawler': return '#dcdc8a';
            case 'exploder':
            case 'bloater': return '#ffcc66';
            case 'armored': return '#ffd27a';
            case 'healer': return '#00ff88';
            case 'screecher': return '#ff66ff';
            case 'brute': return '#ffb3b3';
            case 'necromancer': return '#c9a0ff';
            case 'stalker': return '#b0ffd9';
            case 'acid': return '#00ff66';
            case 'mutant': return '#ffd27a';
            case 'vomiter': return '#e6ff88';
            case 'shielder': return '#dff7ff';
            case 'kamikaze': return '#ffd8a8';
            case 'phaser': return '#88f7ff';
            case 'leaper': return '#fff2b3';
            case 'mimic': return '#ffd8b3';
            case 'frost': return '#bfefff';
            case 'electro': return '#bfffe8';
            case 'swarm': return '#ffd27a';
            case 'razor': return '#ffb3b3';
            case 'ghost': return '#c8d8e8';
            case 'juggernaut': return '#ffb3b3';
            case 'bomber': return '#ffd6b3';
            case 'behemoth': return '#ffdddd';
            default: return '#ff0000';
        }
    }
}