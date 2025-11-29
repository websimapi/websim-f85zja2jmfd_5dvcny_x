export class HomingBomb {
    constructor(x, y, baseDamage = 6, game) {
        this.x = x;
        this.y = y;
        this.speed = 5;
        this.radius = 8;
        this.life = 300; // frames safety
        this.target = null;
        this.baseDamage = baseDamage;
        this.game = game;
        this.exploded = false;
        // set explosion radius to 4.5 times the bomb radius for desired 4.5 AOE
        const radiusBonus = game && game._bombRadiusBonus ? (1 + game._bombRadiusBonus) : 1;
        this.explosionRadius = this.radius * 4.5 * radiusBonus;
        this.vx = 0;
        this.vy = 0;
    }

    findTarget() {
        if (!this.game.zombies || this.game.zombies.length === 0) return null;
        // choose nearest zombie
        let nearest = null;
        let nd = Infinity;
        for (const z of this.game.zombies) {
            const d = Math.hypot(z.x - this.x, z.y - this.y);
            if (d < nd) {
                nd = d;
                nearest = z;
            }
        }
        return nearest;
    }

    update() {
        if (this.exploded) return;
        if (!this.target || this.game.zombies.indexOf(this.target) === -1) {
            this.target = this.findTarget();
        }
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;
            // steering toward target
            this.vx += nx * 0.6;
            this.vy += ny * 0.6;
        } else {
            // drift right if no target
            this.vx += 0.05;
        }

        // limit speed
        const spd = Math.hypot(this.vx, this.vy);
        if (spd > this.speed) {
            this.vx = (this.vx / spd) * this.speed;
            this.vy = (this.vy / spd) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // check for explosion proximity
        for (let i = this.game.zombies.length - 1; i >= 0; i--) {
            const z = this.game.zombies[i];
            const d = Math.hypot(z.x - this.x, z.y - this.y);
            if (d <= this.explosionRadius * 0.7) {
                this.explode();
                break;
            }
        }

        this.life--;
        if (this.life <= 0) this.explode();
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;
        // make big blood / gore
        this.game.particleSystem.createBlood(this.x, this.y, 'normal');
        // affect nearby zombies
        const damage = this.baseDamage * (this.game && this.game.bombDamageMultiplier ? this.game.bombDamageMultiplier : 1);
        for (let i = this.game.zombies.length - 1; i >= 0; i--) {
            const z = this.game.zombies[i];
            const d = Math.hypot(z.x - this.x, z.y - this.y);
            if (d <= this.explosionRadius) {
                z.health -= damage;
                z.staggerTimer = 10;
                // small reward and particles
                this.game.particleSystem.createBlood(z.x, z.y, z.type);
                if (z.health <= 0) {
                    // handle kill
                    const idx = this.game.zombies.indexOf(z);
                    if (idx !== -1) this.game.killZombie(z, idx);
                }
            }
        }
        // create explosion particles
        for (let i = 0; i < 18; i++) {
            this.game.particleSystem.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                maxLife: 40,
                color: '#ff8a00',
                size: Math.random() * 6 + 3,
                type: 'explosion'
            });
        }

        // Chain Detonation shard node: chance to refund ammo and shard on bomb kills
        if (this.game && this.game._chainDetonation) {
            const anyKills = true; // conservative: assume at least one kill in heavy bomb use
            if (anyKills && Math.random() < 0.25) {
                if (this.game.player.ammo < this.game.player.maxAmmo) {
                    this.game.player.ammo += 1;
                }
                this.game.shards += 1;
                this.game.createFloatingText(this.x, this.y - 20, '+1 AMMO, +1 SHARD', '#ffdd88');
                this.game.updateAmmoDisplay();
                this.game.updateShardDisplay();
            }
        }
    }

    draw(ctx) {
        if (this.exploded) return;
        // body
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // glow
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 4);
        g.addColorStop(0, 'rgba(255,136,0,0.6)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // direction streak
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}