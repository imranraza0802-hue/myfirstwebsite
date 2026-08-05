class SpriteEngine {
    constructor() {
        this.colors = {
            sky: '#5c94fc',
            skyCave: '#000000',
            skyCloud: '#3ab0ff',
            skyWater: '#0f2b5c',
            skyCastle: '#1c001c',
            ground: '#c84c0c',
            groundCave: '#0058f8',
            groundCloud: '#ffffff',
            groundWater: '#00588f',
            groundCastle: '#666666',
            brick: '#c84c0c',
            brickCave: '#0058f8',
            brickCastle: '#444444',
            marioRed: '#e52521',
            marioBrown: '#b30f0c',
            marioSkin: '#fcc088',
            marioWhite: '#ffffff',
            goombaBrown: '#a81000',
            goombaSkin: '#fcc088',
            koopaGreen: '#00a800',
            koopaYellow: '#fcf800',
            koopaShell: '#008800',
            bowserGreen: '#008800',
            bowserOrange: '#fc9838',
            bowserShell: '#385800',
            bowserHair: '#e52521',
            lavaRed: '#ff3b30',
            lavaOrange: '#ff9500'
        };
    }

    // DRAW TILES
    drawTile(ctx, type, x, y, size, tick, levelType = 0) {
        ctx.save();
        ctx.translate(x, y);

        // Determine theme colors based on level type
        let gColor = this.colors.ground;
        let bColor = this.colors.brick;
        let sColor = '#fc9838'; // brick shadow/highlights

        if (levelType === 1) { // Cave
            gColor = this.colors.groundCave;
            bColor = this.colors.brickCave;
            sColor = '#00f8f8';
        } else if (levelType === 2) { // Cloud
            gColor = '#b8b8f8';
            bColor = '#e0e0f8';
            sColor = '#ffffff';
        } else if (levelType === 3) { // Water
            gColor = this.colors.groundWater;
            bColor = '#00588f';
            sColor = '#00a8f8';
        } else if (levelType === 4) { // Castle
            gColor = this.colors.groundCastle;
            bColor = this.colors.brickCastle;
            sColor = '#111111';
        }

        switch (type) {
            case 1: // Ground Block
                // Main block
                ctx.fillStyle = gColor;
                ctx.fillRect(0, 0, size, size);
                // Bevel borders
                ctx.fillStyle = sColor;
                ctx.fillRect(0, 0, size, 2);
                ctx.fillRect(0, 0, 2, size);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, size - 2, size, 2);
                ctx.fillRect(size - 2, 0, 2, size);
                // Internal crack pattern for retro look
                ctx.fillStyle = '#000000';
                ctx.fillRect(size/4, size/4, 2, size/2);
                ctx.fillRect(size/2, size/4, size/4, 2);
                break;

            case 2: // Breakable Brick
                // Brick backing
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, size, size);
                // Rows of bricks
                ctx.fillStyle = bColor;
                const rowH = size / 4;
                for (let r = 0; r < 4; r++) {
                    const ry = r * rowH;
                    ctx.fillStyle = bColor;
                    ctx.fillRect(1, ry + 1, size - 2, rowH - 1);
                    
                    // Highlights on bricks
                    ctx.fillStyle = sColor;
                    ctx.fillRect(2, ry + 1, size - 4, 1);

                    // Brick joints
                    ctx.fillStyle = '#000000';
                    if (r % 2 === 0) {
                        ctx.fillRect(size / 2, ry, 1.5, rowH);
                    } else {
                        ctx.fillRect(size / 4, ry, 1.5, rowH);
                        ctx.fillRect((3 * size) / 4, ry, 1.5, rowH);
                    }
                }
                break;

            case 3: // Question Block (Active)
            case 4: // Question Block (Power-up)
                // Pulse size a little based on game tick
                const pulse = Math.sin(tick * 0.15) * 1.5;
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, size, size);

                const grad = ctx.createLinearGradient(0, 0, size, size);
                grad.addColorStop(0, '#fc9838');
                grad.addColorStop(0.5, '#fcf800');
                grad.addColorStop(1, '#a81000');
                ctx.fillStyle = grad;
                ctx.fillRect(2, 2, size - 4, size - 4);

                // Corner rivets
                ctx.fillStyle = '#000';
                ctx.fillRect(3, 3, 2, 2);
                ctx.fillRect(size - 5, 3, 2, 2);
                ctx.fillRect(3, size - 5, 2, 2);
                ctx.fillRect(size - 5, size - 5, 2, 2);

                // Drawing the Question Mark
                ctx.fillStyle = '#000000';
                ctx.font = `bold ${size * 0.75}px ${this.colors.retroFont || 'sans-serif'}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', size / 2 + 1, size / 2 + pulse);
                ctx.fillStyle = '#ffffff';
                ctx.fillText('?', size / 2, size / 2 - 1 + pulse);
                break;

            case 5: // Hit Question Block / Solid Block
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#8f9f8f';
                if (levelType === 1 || levelType === 4) ctx.fillStyle = '#8c8c8c';
                ctx.fillRect(1, 1, size - 2, size - 2);
                // Rivets
                ctx.fillStyle = '#555';
                ctx.fillRect(3, 3, 2.5, 2.5);
                ctx.fillRect(size - 5.5, 3, 2.5, 2.5);
                ctx.fillRect(3, size - 5.5, 2.5, 2.5);
                ctx.fillRect(size - 5.5, size - 5.5, 2.5, 2.5);
                break;

            case 6: // Pipe Top-Left
                ctx.fillStyle = '#004800';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#00a800';
                ctx.fillRect(4, 0, size - 4, size);
                ctx.fillStyle = '#80d010'; // Pipe highlight
                ctx.fillRect(8, 0, 4, size);
                break;
            case 7: // Pipe Top-Right
                ctx.fillStyle = '#004800';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#00a800';
                ctx.fillRect(0, 0, size - 4, size);
                ctx.fillStyle = '#007000'; // Pipe dark shadow
                ctx.fillRect(size - 8, 0, 4, size);
                break;
            case 8: // Pipe Body-Left
                ctx.fillStyle = '#004800';
                ctx.fillRect(4, 0, size - 4, size);
                ctx.fillStyle = '#00a800';
                ctx.fillRect(8, 0, size - 8, size);
                ctx.fillStyle = '#80d010';
                ctx.fillRect(12, 0, 4, size);
                break;
            case 9: // Pipe Body-Right
                ctx.fillStyle = '#004800';
                ctx.fillRect(0, 0, size - 4, size);
                ctx.fillStyle = '#00a800';
                ctx.fillRect(0, 0, size - 8, size);
                ctx.fillStyle = '#007000';
                ctx.fillRect(size - 12, 0, 4, size);
                break;

            case 10: // Lava Block (Castle Hazard)
                const wave = Math.sin(tick * 0.15 + x * 0.1) * 4;
                // Lava base
                const lGrad = ctx.createLinearGradient(0, 0, 0, size);
                lGrad.addColorStop(0, this.colors.lavaRed);
                lGrad.addColorStop(0.6, this.colors.lavaOrange);
                lGrad.addColorStop(1, '#550000');
                ctx.fillStyle = lGrad;
                ctx.fillRect(0, 4 + wave, size, size - 4 - wave);

                // Bubbles and waves
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(Math.abs(Math.sin(tick*0.05 + x)*size)%size, 8 + Math.abs(Math.cos(tick*0.05 + y)*20)%(size-12), 3, 3);
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(0, 4 + wave, size, 2);
                break;

            case 11: // Water Block
                const wWave = Math.sin(tick * 0.1 + x * 0.05) * 3;
                ctx.fillStyle = 'rgba(15, 88, 248, 0.45)';
                ctx.fillRect(0, 0, size, size);
                
                // Draw currents/waves
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, size/2 + wWave);
                ctx.bezierCurveTo(size/3, size/2 + wWave - 5, 2*size/3, size/2 + wWave + 5, size, size/2 + wWave);
                ctx.stroke();
                
                // Bubble
                if ((tick + x) % 180 < 40) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath();
                    ctx.arc(size/2, size - ((tick + x)%180)*0.75, 2, 0, Math.PI*2);
                    ctx.fill();
                }
                break;
        }
        ctx.restore();
    }

    // DRAW MARIO
    drawMario(ctx, state, x, y, width, height, direction, keys, runFrame, invulnTick) {
        // Invincibility flickering
        if (invulnTick > 0 && Math.floor(invulnTick / 3) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        
        // Flip image horizontally depending on facing direction (-1 = Left, 1 = Right)
        if (direction === -1) {
            ctx.scale(-1, 1);
        }

        // Mario colors
        let primaryColor = this.colors.marioRed;
        let overallColor = this.colors.marioBrown;
        let skinColor = this.colors.marioSkin;
        let capColor = this.colors.marioRed;

        if (state === 2) { // Fire Mario
            primaryColor = this.colors.marioWhite;
            overallColor = this.colors.marioRed;
            capColor = this.colors.marioWhite;
        }

        const isBig = state >= 1;
        const scale = isBig ? 1 : 0.65;
        
        ctx.scale(scale, scale);

        // Drawing Big or Scaled Small Mario
        // HEAD & CAP
        ctx.fillStyle = capColor;
        ctx.fillRect(-8, -16, 14, 4); // cap visor/brim
        ctx.fillRect(-6, -18, 10, 3); // cap top
        
        // HAIR & EAR & EYE
        ctx.fillStyle = this.colors.marioBrown;
        ctx.fillRect(-8, -12, 3, 5); // back hair
        ctx.fillRect(-8, -9, 4, 3);
        ctx.fillRect(-4, -10, 2, 3); // sideburns
        ctx.fillRect(2, -12, 2, 3); // mustache back
        ctx.fillRect(1, -11, 4, 2); // mustache front

        ctx.fillStyle = skinColor;
        ctx.fillRect(-5, -12, 7, 7); // face base
        ctx.fillRect(-7, -10, 2, 2); // ear
        ctx.fillRect(2, -14, 3, 3); // nose

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, -13, 2, 3); // eye

        // TORSO / OVERALLS
        ctx.fillStyle = overallColor;
        ctx.fillRect(-5, -5, 10, 11); // body main
        
        // RED SHIRT (arms/collar)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(-4, -5, 8, 2); // collar
        
        // Walking/running arm frames
        const armCycle = Math.floor(runFrame) % 3;
        if (keys && (keys.left || keys.right)) {
            if (armCycle === 0) {
                // Arm down-back
                ctx.fillRect(-8, -4, 4, 6);
                ctx.fillStyle = skinColor;
                ctx.fillRect(-9, 2, 3, 3);
                // Arm forward-up
                ctx.fillStyle = primaryColor;
                ctx.fillRect(4, -5, 4, 5);
                ctx.fillStyle = skinColor;
                ctx.fillRect(5, -8, 3, 3);
            } else if (armCycle === 1) {
                // Arms normal
                ctx.fillRect(-7, -4, 3, 5);
                ctx.fillRect(4, -4, 3, 5);
                ctx.fillStyle = skinColor;
                ctx.fillRect(-7, 1, 3, 3);
                ctx.fillRect(4, 1, 3, 3);
            } else {
                // Arm forward-down
                ctx.fillRect(4, -2, 4, 6);
                ctx.fillStyle = skinColor;
                ctx.fillRect(5, 4, 3, 3);
                // Arm back-up
                ctx.fillStyle = primaryColor;
                ctx.fillRect(-8, -5, 4, 5);
                ctx.fillStyle = skinColor;
                ctx.fillRect(-9, -8, 3, 3);
            }
        } else if (Math.abs(window.game?.player?.vy || 0) > 0.5) {
            // JUMPING FRAME
            // Arm back up
            ctx.fillRect(-8, -6, 4, 5);
            ctx.fillStyle = skinColor;
            ctx.fillRect(-9, -9, 3, 3);
            // Arm forward up reaching
            ctx.fillStyle = primaryColor;
            ctx.fillRect(4, -9, 4, 6);
            ctx.fillStyle = skinColor;
            ctx.fillRect(4, -12, 4, 3);
        } else {
            // STANDING
            ctx.fillRect(-7, -4, 3, 6); // arm left
            ctx.fillRect(4, -4, 3, 6);  // arm right
            ctx.fillStyle = skinColor;
            ctx.fillRect(-7, 2, 3, 3);   // hand left
            ctx.fillRect(4, 2, 3, 3);    // hand right
        }

        // Yellow overall buttons
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(-2, 0, 1.5, 2);
        ctx.fillRect(2, 0, 1.5, 2);

        // LEGS & SHOES
        ctx.fillStyle = overallColor;
        // Legs cycle
        if (keys && (keys.left || keys.right)) {
            const legCycle = Math.floor(runFrame) % 3;
            if (legCycle === 0) {
                ctx.fillRect(-5, 6, 4, 6); // Left leg
                ctx.fillRect(1, 6, 4, 3);  // Right leg bent
                ctx.fillStyle = this.colors.marioBrown;
                ctx.fillRect(-6, 12, 5, 3); // Left shoe
                ctx.fillRect(1, 9, 4, 3);  // Right shoe
            } else if (legCycle === 1) {
                ctx.fillRect(-4, 6, 3, 5);
                ctx.fillRect(1, 6, 3, 5);
                ctx.fillStyle = this.colors.marioBrown;
                ctx.fillRect(-5, 11, 4, 3);
                ctx.fillRect(1, 11, 4, 3);
            } else {
                ctx.fillRect(-4, 6, 3, 3);  // Left bent
                ctx.fillRect(1, 6, 4, 6);   // Right leg
                ctx.fillStyle = this.colors.marioBrown;
                ctx.fillRect(-4, 9, 4, 3);
                ctx.fillRect(1, 12, 5, 3);
            }
        } else if (Math.abs(window.game?.player?.vy || 0) > 0.5) {
            // Jumping legs wide
            ctx.fillRect(-5, 6, 4, 4);
            ctx.fillRect(1, 6, 4, 4);
            ctx.fillStyle = this.colors.marioBrown;
            ctx.fillRect(-6, 10, 4, 3);
            ctx.fillRect(2, 10, 4, 3);
        } else {
            // STANDING LEGS
            ctx.fillRect(-5, 6, 4, 6);
            ctx.fillRect(1, 6, 4, 6);
            ctx.fillStyle = this.colors.marioBrown;
            ctx.fillRect(-6, 12, 5, 3.5);
            ctx.fillRect(1, 12, 5, 3.5);
        }

        ctx.restore();
    }

    // DRAW ENEMIES
    drawEnemy(ctx, type, frame, x, y, width, height, direction) {
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        
        // Flip on direction
        if (direction === 1) {
            ctx.scale(-1, 1);
        }

        const walkTick = Math.floor(frame * 0.15) % 2;

        switch (type) {
            case 'goomba': {
                // Head (Brown dome)
                ctx.fillStyle = this.colors.goombaBrown;
                ctx.beginPath();
                ctx.arc(0, -2, width/2, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(-width/2, -2, width, height * 0.5);

                // Cheeks / Skin stem
                ctx.fillStyle = this.colors.goombaSkin;
                ctx.fillRect(-width*0.3, 2, width*0.6, height*0.4);

                // Eyes (angry brows)
                ctx.fillStyle = '#000000';
                ctx.fillRect(-5, -4, 2, 4);
                ctx.fillRect(3, -4, 2, 4);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-7, -5); ctx.lineTo(-2, -3);
                ctx.moveTo(7, -5); ctx.lineTo(2, -3);
                ctx.stroke();

                // Fangs (White)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-4, 2, 1.5, 2);
                ctx.fillRect(2.5, 2, 1.5, 2);

                // Feet (black blocks moving)
                ctx.fillStyle = '#1e1e1e';
                if (walkTick === 0) {
                    ctx.fillRect(-9, height/2 - 4, 5, 4); // Left foot out
                    ctx.fillRect(1, height/2 - 3, 5, 3);
                } else {
                    ctx.fillRect(-6, height/2 - 3, 5, 3);
                    ctx.fillRect(4, height/2 - 4, 5, 4); // Right foot out
                }
                break;
            }
            case 'koopa': {
                // Shell (Green oval)
                ctx.fillStyle = this.colors.koopaShell;
                ctx.beginPath();
                ctx.ellipse(-1, -1, width*0.4, height*0.4, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Yellow neck and head
                ctx.fillStyle = this.colors.koopaYellow;
                ctx.fillRect(1, -12, 6, 8); // neck
                ctx.fillRect(1, -16, 9, 6); // head
                // Big eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(5, -15, 3, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(6, -14, 1.5, 2.5);

                // Legs walking
                ctx.fillStyle = this.colors.koopaYellow;
                if (walkTick === 0) {
                    ctx.fillRect(-7, 3, 4, height*0.35); // back leg down
                    ctx.fillRect(1, 3, 4, height*0.25); // front leg bent
                } else {
                    ctx.fillRect(-5, 3, 4, height*0.25);
                    ctx.fillRect(3, 3, 4, height*0.35);
                }
                // Tail
                ctx.fillStyle = this.colors.koopaYellow;
                ctx.beginPath();
                ctx.moveTo(-8, 0); ctx.lineTo(-12, 2); ctx.lineTo(-8, 3);
                ctx.fill();
                break;
            }
            case 'koopa_shell': {
                // Hiding shell (Stomped)
                ctx.fillStyle = this.colors.koopaShell;
                ctx.beginPath();
                ctx.arc(0, 2, width*0.45, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(-width*0.45, 2, width*0.9, 6);
                
                // Yellow underside lines
                ctx.fillStyle = this.colors.koopaYellow;
                ctx.fillRect(-width*0.45, 8, width*0.9, 2);
                break;
            }
            case 'paratroopa': {
                // Draws regular Koopa
                this.drawEnemy(ctx, 'koopa', frame, -width/2, -height/2, width, height, 0);
                
                // Plus custom animated white wing
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#bbb';
                ctx.lineWidth = 1;
                const wingWav = Math.sin(frame * 0.25) * 6;
                ctx.beginPath();
                ctx.ellipse(-8, -4, 4, 8 + wingWav, Math.PI/4, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                break;
            }
            case 'blooper': { // Squid
                ctx.fillStyle = '#ffffff';
                // Main pointed hood
                ctx.beginPath();
                ctx.moveTo(0, -height/2);
                ctx.lineTo(width/2 - 2, 0);
                ctx.lineTo(-width/2 + 2, 0);
                ctx.fill();
                ctx.fillRect(-width/2 + 2, 0, width - 4, height*0.3);

                // Black eyes panel
                ctx.fillStyle = '#000000';
                ctx.fillRect(-width/2 + 4, -4, width - 8, 4);
                // White eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-5, -4, 2, 3);
                ctx.fillRect(3, -4, 2, 3);

                // Tentacles (Waving)
                ctx.fillStyle = '#ffffff';
                const waveTent = Math.sin(frame * 0.1) * 3;
                ctx.fillRect(-6, height*0.3, 3, height*0.3 + waveTent);
                ctx.fillRect(-2, height*0.3, 3, height*0.45 - waveTent);
                ctx.fillRect(3, height*0.3, 3, height*0.3 + waveTent);
                break;
            }
            case 'cheep_cheep': { // Fish
                // Round red body
                ctx.fillStyle = this.colors.marioRed;
                ctx.beginPath();
                ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI*2);
                ctx.fill();

                // Big eyes
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(6, -2, 6, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.fillRect(6, -4, 2.5, 3.5);

                // Yellow tail fin
                ctx.fillStyle = this.colors.koopaYellow;
                ctx.beginPath();
                ctx.moveTo(-width/2, 0);
                ctx.lineTo(-width/2 - 6, -6);
                ctx.lineTo(-width/2 - 4, 0);
                ctx.lineTo(-width/2 - 6, 6);
                ctx.fill();

                // White belly/lips
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(3, height/2 - 3, 6, 3, 0, 0, Math.PI*2);
                ctx.fill();
                break;
            }
            case 'thwomp': { // Spike stone block
                ctx.fillStyle = '#2d2d3a';
                ctx.fillRect(-width/2, -height/2, width, height);

                // Spikes along edges
                ctx.fillStyle = '#6f6f89';
                for (let i = -width/2; i <= width/2; i += 6) {
                    // Top spikes
                    ctx.beginPath();
                    ctx.moveTo(i, -height/2); ctx.lineTo(i+3, -height/2 - 4); ctx.lineTo(i+6, -height/2); ctx.fill();
                    // Bottom spikes
                    ctx.beginPath();
                    ctx.moveTo(i, height/2); ctx.lineTo(i+3, height/2 + 4); ctx.lineTo(i+6, height/2); ctx.fill();
                }

                // Angry Face
                ctx.fillStyle = '#9e1a1a'; // red glowing eyes
                ctx.fillRect(-6, -6, 4, 3);
                ctx.fillRect(2, -6, 4, 3);
                ctx.fillStyle = '#000000';
                ctx.fillRect(-5, -5, 2, 2);
                ctx.fillRect(3, -5, 2, 2);
                
                // Grinning teeth/mouth
                ctx.fillStyle = '#cccccc';
                ctx.fillRect(-8, 3, 16, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(-7, 4.5, 14, 1);
                break;
            }
            case 'bowser': { // Bowser Boss!
                const mouthOpen = Math.floor(frame * 0.05) % 2 === 0;

                // Green spike shell on back
                ctx.fillStyle = this.colors.bowserShell;
                ctx.beginPath();
                ctx.ellipse(-10, 2, 18, 22, 0, 0, Math.PI*2);
                ctx.fill();
                // Spikes on shell (white/orange triangles)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(-22, -4); ctx.lineTo(-27, -4); ctx.lineTo(-20, 2); ctx.fill();
                ctx.moveTo(-20, 10); ctx.lineTo(-25, 12); ctx.lineTo(-18, 14); ctx.fill();

                // Yellow scales / main body
                ctx.fillStyle = this.colors.bowserOrange;
                ctx.fillRect(-5, -6, 16, 26); // body core

                // Green dragon scales head
                ctx.fillStyle = this.colors.bowserGreen;
                ctx.fillRect(4, -20, 14, 12); // head
                ctx.fillStyle = this.colors.bowserOrange;
                ctx.fillRect(8, -13, 12, 7); // snout/muzzle
                
                // Horns (White)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(4, -20); ctx.lineTo(-4, -24); ctx.lineTo(6, -23); ctx.fill();

                // Angry Red Eye
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(10, -18, 4, 3);
                ctx.fillStyle = '#fcf800';
                ctx.fillRect(11, -17, 1.5, 1.5);

                // Mouth (Fire shooting frame)
                ctx.fillStyle = '#000';
                if (mouthOpen) {
                    ctx.fillRect(12, -9, 8, 4); // open mouth gap
                    ctx.fillStyle = '#ff3c00'; // fiery glow inside
                    ctx.fillRect(14, -8.5, 6, 3);
                } else {
                    ctx.fillRect(14, -8, 6, 1.5); // thin closed lip
                }

                // Fiery Red Hair
                ctx.fillStyle = this.colors.bowserHair;
                ctx.beginPath();
                ctx.arc(3, -20, 6, 0, Math.PI*2); ctx.fill();
                ctx.beginPath();
                ctx.arc(-2, -18, 5, 0, Math.PI*2); ctx.fill();

                // Claws & legs
                ctx.fillStyle = this.colors.bowserOrange;
                ctx.fillRect(-12, 20, 8, 8); // left foot
                ctx.fillRect(2, 20, 8, 8);  // right foot
                ctx.fillStyle = '#fff';
                ctx.fillRect(-13, 25, 2, 3);
                ctx.fillRect(-9, 25, 2, 3);
                ctx.fillRect(1, 25, 2, 3);
                ctx.fillRect(5, 25, 2, 3);
                break;
            }
        }
        ctx.restore();
    }

    // DRAW POWERUPS & ITEMS
    drawItem(ctx, type, frame, x, y, size) {
        ctx.save();
        ctx.translate(x + size/2, y + size/2);

        switch (type) {
            case 'coin': {
                // Pulsing glowing spinning coin
                const rot = Math.abs(Math.sin(frame * 0.12));
                ctx.scale(rot, 1);

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI*2);
                ctx.fill();

                ctx.fillStyle = '#fcf800';
                ctx.beginPath();
                ctx.arc(0, 0, size/2 - 1, 0, Math.PI*2);
                ctx.fill();

                // Inner rim
                ctx.strokeStyle = '#e52521';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, size/3, 0, Math.PI*2);
                ctx.stroke();

                // Inner shine
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-1.5, -size/4, 3, size/2);
                break;
            }
            case 'mushroom': { // Super Mushroom (+Size)
                // Cap
                ctx.fillStyle = '#000';
                ctx.fillRect(-size/2, -size/2, size, size); // back
                
                ctx.fillStyle = '#e52521'; // red cap
                ctx.beginPath();
                ctx.arc(0, -1, size/2 - 1, Math.PI, 0);
                ctx.fill();

                // White spots
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, -4, 3.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath();
                ctx.arc(-6, -1, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath();
                ctx.arc(6, -1, 2, 0, Math.PI*2); ctx.fill();

                // Stem
                ctx.fillStyle = '#fcc088';
                ctx.fillRect(-4, 1, 8, 6);
                
                // Eyes
                ctx.fillStyle = '#000000';
                ctx.fillRect(-2, 2, 1, 3);
                ctx.fillRect(1, 2, 1, 3);
                break;
            }
            case '1up': { // 1up Extra Life Mushroom
                // cap (green)
                ctx.fillStyle = '#000';
                ctx.fillRect(-size/2, -size/2, size, size);
                
                ctx.fillStyle = '#00a800'; // green cap
                ctx.beginPath();
                ctx.arc(0, -1, size/2 - 1, Math.PI, 0);
                ctx.fill();

                // Spots
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, -4, 3.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath();
                ctx.arc(-6, -1, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath();
                ctx.arc(6, -1, 2, 0, Math.PI*2); ctx.fill();

                // Stem
                ctx.fillStyle = '#fcc088';
                ctx.fillRect(-4, 1, 8, 6);
                ctx.fillStyle = '#000000';
                ctx.fillRect(-2, 2, 1, 3);
                ctx.fillRect(1, 2, 1, 3);
                break;
            }
            case 'flower': { // Fire Flower
                // Glowing stem and circular flower
                const pulse = Math.abs(Math.sin(frame * 0.1)) * 3;
                
                // Green stem
                ctx.fillStyle = '#00a800';
                ctx.fillRect(-2, 1, 4, 7);
                ctx.fillRect(-5, 2, 10, 2);

                // Outer circle (Red)
                ctx.fillStyle = '#e52521';
                ctx.beginPath();
                ctx.arc(0, -3, 7 + pulse*0.3, 0, Math.PI*2);
                ctx.fill();

                // Orange ring
                ctx.fillStyle = '#fc9838';
                ctx.beginPath();
                ctx.arc(0, -3, 5 + pulse*0.2, 0, Math.PI*2);
                ctx.fill();

                // Yellow core
                ctx.fillStyle = '#ffea00';
                ctx.beginPath();
                ctx.arc(0, -3, 3, 0, Math.PI*2);
                ctx.fill();

                // Eyes in core
                ctx.fillStyle = '#000000';
                ctx.fillRect(-1, -4, 0.8, 2);
                ctx.fillRect(0.2, -4, 0.8, 2);
                break;
            }
            case 'star': { // Starman (Invincibility)
                const blink = Math.floor(frame * 0.2) % 3;
                let sCol = '#ffea00';
                if (blink === 1) sCol = '#fc9838';
                if (blink === 2) sCol = '#ff007f';

                ctx.fillStyle = sCol;
                // Draw 5 point star
                ctx.beginPath();
                ctx.moveTo(0, -size/2);
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.sin(i * Math.PI*0.8) * size/2, -Math.cos(i * Math.PI*0.8) * size/2);
                }
                ctx.closePath();
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#000000';
                ctx.fillRect(-1.5, -2, 1, 3.5);
                ctx.fillRect(0.5, -2, 1, 3.5);
                break;
            }
            case 'fireball': {
                // Spinning fiery orange projectball
                const rot = frame * 0.3;
                ctx.rotate(rot);

                const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, size/2);
                glow.addColorStop(0, '#ffffff');
                glow.addColorStop(0.3, '#ffea00');
                glow.addColorStop(0.7, '#ff3b30');
                glow.addColorStop(1, 'rgba(255,0,0,0)');
                
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI*2);
                ctx.fill();
                break;
            }
        }
        ctx.restore();
    }

    // DRAW BACKGROUND DECORATIONS
    drawBackdecor(ctx, type, x, y, tick) {
        ctx.save();
        ctx.translate(x, y);

        switch (type) {
            case 'cloud': {
                // Retro white cloud
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI*2);
                ctx.arc(20, -5, 22, 0, Math.PI*2);
                ctx.arc(45, 0, 16, 0, Math.PI*2);
                ctx.fill();
                ctx.fillRect(-10, 0, 60, 16);
                break;
            }
            case 'hill': {
                // Green layered hill with borders
                const width = 120;
                const height = 60;
                
                const grad = ctx.createLinearGradient(0, -height, 0, 0);
                grad.addColorStop(0, '#00a800');
                grad.addColorStop(1, '#004800');
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(-width/2, 0);
                ctx.quadraticCurveTo(0, -height * 1.8, width/2, 0);
                ctx.closePath();
                ctx.fill();
                
                // Highlight borders
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            }
            case 'shrub': {
                // Shrub cluster
                ctx.fillStyle = '#007000';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI*2);
                ctx.arc(12, -4, 15, 0, Math.PI*2);
                ctx.arc(24, 0, 10, 0, Math.PI*2);
                ctx.fill();
                ctx.fillRect(-6, 0, 36, 10);
                break;
            }
            case 'castle_bg': {
                // Castle wall pillar shadows
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(0, 0, 32, 240);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(4, 0, 2, 240);
                ctx.fillRect(26, 0, 2, 240);
                break;
            }
        }
        ctx.restore();
    }
}

// Global sprites object
window.sprites = new SpriteEngine();
