export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    createMuzzleFlash(x, y) {
        // Enhanced muzzle flash with smoke
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 12,
                maxLife: 12,
                color: `hsl(${30 + Math.random() * 30}, 100%, ${70 + Math.random() * 30}%)`,
                size: Math.random() * 6 + 4,
                type: 'muzzle'
            });
        }
        
        // Add smoke
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                life: 40,
                maxLife: 40,
                color: 'rgba(100, 100, 100, 0.6)',
                size: Math.random() * 8 + 6,
                type: 'smoke'
            });
        }
    }

    createBlood(x, y, zombieType = 'normal') {
        const particleCount = zombieType === 'tank' ? 35 : 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 3,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                color: zombieType === 'tank' ? '#2B0000' : '#6B0000',
                size: Math.random() * 5 + 2,
                type: 'blood'
            });
        }
        
        // Add blood mist
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 2,
                life: 20,
                maxLife: 20,
                color: 'rgba(139, 0, 0, 0.4)',
                size: Math.random() * 10 + 8,
                type: 'mist'
            });
        }
    }

    createFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 60,
            maxLife: 60,
            vy: -2,
            vx: (Math.random() - 0.5) * 2
        });
    }

    createCoinBurst(x, y, amount) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                life: 50,
                maxLife: 50,
                color: '#FFD700',
                size: Math.random() * 4 + 2,
                type: 'coin'
            });
        }
        this.createFloatingText(x, y, `+${amount}`, '#FFD700');
    }

    update() {
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Different physics for different particle types
            if (particle.type === 'blood' || particle.type === 'gore') {
                particle.vy += 0.4; // gravity
                particle.vx *= 0.99; // air resistance
            } else if (particle.type === 'smoke') {
                particle.vy -= 0.1; // smoke rises
                particle.vx *= 0.98;
                particle.vy *= 0.98;
            } else if (particle.type === 'shell') {
                particle.vy += particle.gravity || 0.3;
                particle.vx *= 0.98;
            } else if (particle.type === 'mist') {
                particle.vx *= 0.95;
                particle.vy *= 0.95;
            }
            
            particle.life--;
            return particle.life > 0;
        });

        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(text => {
            text.y += text.vy;
            text.x += text.vx;
            text.vy *= 0.95; // slow down
            text.vx *= 0.95;
            text.life--;
            return text.life > 0;
        });
    }

    draw(ctx) {
        // Draw particles with better rendering
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.globalAlpha = alpha;
            
            if (particle.type === 'smoke' || particle.type === 'mist') {
                // Soft smoke/mist rendering
                const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Regular particles
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw floating texts
        this.floatingTexts.forEach(text => {
            const alpha = text.life / text.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = text.color;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(text.text, text.x, text.y);
        });

        ctx.globalAlpha = 1;
    }
}

