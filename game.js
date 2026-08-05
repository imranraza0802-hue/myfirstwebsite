class MarioGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Match canvas dimensions (800x480 results in 25x15 grid of 32px tiles)
        this.canvas.width = 800;
        this.canvas.height = 480;
        this.tileSize = 32;

        // Game states: 'MENU', 'PLAYING', 'GAMEOVER', 'VICTORY'
        this.state = 'MENU';
        this.currentLevelIndex = 0;
        this.level = null;

        // Persistent stats
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.timeLeft = 400;
        this.timerInterval = null;

        // Player object
        this.player = {
            x: 0, y: 0,
            vx: 0, vy: 0,
            width: 20, height: 28, // dynamic based on state (small/big)
            state: 0, // 0 = Small, 1 = Big, 2 = Fire
            direction: 1, // -1 = Left, 1 = Right
            onGround: false,
            invincibilityTick: 0,
            starmanTick: 0,
            isDying: false,
            deathTick: 0,
            runFrame: 0
        };

        // Active game objects
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.particles = [];
        this.firebars = [];

        // Camera offset
        this.cameraX = 0;
        this.maxCameraX = 0;

        // Animation/game frame ticks
        this.tick = 0;
        this.paused = false;

        // Keys map
        this.keys = {
            left: false, right: false, up: false, down: false,
            jump: false, run: false
        };

        // Level unlocked progress (Levels 1-5)
        this.unlockedLevels = [true, false, false, false, false];

        this.initInput();
        this.startLoop();
    }

    // ----------------------------------------------------
    // INITIALIZATION & INPUT
    // ----------------------------------------------------
    initInput() {
        // Lose focus on any clicked button to prevent Space/Enter from triggering them
        document.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'BUTTON') {
                e.target.blur();
            }
            // Also handle clicks on child elements of buttons (like span)
            let parent = e.target.parentElement;
            while (parent) {
                if (parent.tagName === 'BUTTON') {
                    parent.blur();
                    break;
                }
                parent = parent.parentElement;
            }
        });

        // Keyboard bindings
        window.addEventListener('keydown', (e) => {
            const gameKeys = [
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyZ', 'Space',
                'KeyX', 'ShiftLeft', 'ShiftRight', 'KeyP', 'Enter'
            ];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
            if (this.player.isDying) return;
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    break;
                case 'KeyZ':
                case 'Space':
                    if (!this.keys.jump) {
                        this.triggerJump();
                    }
                    this.keys.jump = true;
                    break;
                case 'KeyX':
                case 'ShiftLeft':
                case 'ShiftRight':
                    if (!this.keys.run) {
                        this.triggerAction();
                    }
                    this.keys.run = true;
                    break;
                case 'KeyP':
                case 'Enter':
                    this.togglePause();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'KeyZ':
                case 'Space':
                    this.keys.jump = false;
                    // Cut jump velocity in half if released early for variable height
                    if (this.player.vy < -2 && this.level.type !== 3) {
                        this.player.vy *= 0.5;
                    }
                    break;
                case 'KeyX':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.run = false;
                    break;
            }
        });

        // Setup mobile touch events
        this.setupMobileControls();
    }

    setupMobileControls() {
        const bindTouch = (id, action, state) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const handler = (e) => {
                e.preventDefault();
                if (action === 'jump' && state && !this.keys.jump) {
                    this.triggerJump();
                }
                if (action === 'run' && state && !this.keys.run) {
                    this.triggerAction();
                }
                this.keys[action] = state;
            };
            btn.addEventListener('touchstart', handler);
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[action] = false;
            });
        };

        bindTouch('dLeft', 'left', true);
        bindTouch('dRight', 'right', true);
        bindTouch('dUp', 'up', true);
        bindTouch('dDown', 'down', true);
        bindTouch('btnA', 'jump', true);
        bindTouch('btnB', 'run', true);
    }

    // ----------------------------------------------------
    // GAME STATE CONTROLS
    // ----------------------------------------------------
    startLevel(index) {
        if (index > 0 && !this.unlockedLevels[index]) return; // locked

        window.audio.init();
        this.currentLevelIndex = index;
        const template = window.LEVEL_TEMPLATES[index];
        this.level = window.parseLevel(template);
        
        // Reset player state per level run
        this.player.x = this.level.startPos.x;
        this.player.y = this.level.startPos.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isDying = false;
        this.player.deathTick = 0;
        this.player.invincibilityTick = 0;
        this.player.starmanTick = 0;
        this.setPlayerSize();

        // Load level objects
        this.enemies = this.level.enemies.map(e => ({
            type: e.type,
            x: e.x * this.tileSize,
            y: e.y * this.tileSize,
            vx: e.type === 'cheep_cheep' ? -1.5 : (e.type === 'blooper' ? 0 : -0.8),
            vy: 0,
            width: e.type === 'bowser' ? 64 : (e.type === 'thwomp' ? 32 : 24),
            height: e.type === 'bowser' ? 64 : (e.type === 'thwomp' ? 40 : 24),
            direction: -1,
            state: 'WALK', // 'SHELL' for stomped Koopas
            hp: e.type === 'bowser' ? 8 : 1,
            jumpTimer: 0,
            stateTimer: 0
        }));

        this.firebars = this.level.firebars.map(f => ({ ...f }));
        this.items = [];
        this.projectiles = [];
        this.particles = [];
        
        this.cameraX = 0;
        this.maxCameraX = 0;
        this.tick = 0;
        this.paused = false;

        // Timer
        this.timeLeft = this.level.timeLimit;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.paused && this.state === 'PLAYING' && !this.player.isDying) {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.killPlayer();
                }
            }
        }, 1000);

        this.state = 'PLAYING';
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('victoryScreen').classList.add('hidden');
        
        window.audio.playLevelMusic(index);
    }

    setPlayerSize() {
        if (this.player.state === 0) {
            this.player.width = 18;
            this.player.height = 20;
        } else {
            this.player.width = 20;
            this.player.height = 30;
        }
    }

    triggerJump() {
        if (this.player.isDying) return;
        
        if (this.level.type === 3) { // Water Swimming
            this.player.vy = -4.5;
            window.audio.playSFX('jump');
        } else if (this.player.onGround) {
            this.player.vy = -12.5;
            this.player.onGround = false;
            window.audio.playSFX('jump');
        }
    }

    triggerAction() {
        if (this.player.isDying) return;

        // Shoot fireball if Fire Mario
        if (this.player.state === 2 && this.projectiles.length < 2) {
            this.projectiles.push({
                x: this.player.x + (this.player.direction === 1 ? this.player.width : -8),
                y: this.player.y + this.player.height / 3,
                vx: this.player.direction * 5.5,
                vy: 2,
                width: 8,
                height: 8,
                type: 'fireball'
            });
            window.audio.playSFX('fireball');
        }
    }

    togglePause() {
        if (this.state !== 'PLAYING') return;
        this.paused = !this.paused;
        const pauseEl = document.getElementById('pauseOverlay');
        if (this.paused) {
            pauseEl.classList.remove('hidden');
            window.audio.stopMusic();
        } else {
            pauseEl.classList.add('hidden');
            window.audio.playLevelMusic(this.currentLevelIndex);
        }
    }

    // ----------------------------------------------------
    // MAIN ENGINE LOOP
    // ----------------------------------------------------
    startLoop() {
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update() {
        if (this.state !== 'PLAYING' || this.paused) return;

        this.tick++;

        // Update player
        this.updatePlayer();

        if (!this.player.isDying) {
            // Update items
            this.updateItems();

            // Update enemies
            this.updateEnemies();

            // Update projectiles
            this.updateProjectiles();
        }

        // Update particle physics
        this.updateParticles();

        // Update camera position
        this.updateCamera();
    }

    // ----------------------------------------------------
    // PHYSICS & PLAYER LOGIC
    // ----------------------------------------------------
    updatePlayer() {
        if (this.player.isDying) {
            this.player.deathTick++;
            this.player.vy += 0.5; // Gravity during death fall
            this.player.y += this.player.vy;
            if (this.player.deathTick > 120) {
                this.lives--;
                if (this.lives > 0) {
                    this.startLevel(this.currentLevelIndex);
                } else {
                    this.triggerGameOver();
                }
            }
            return;
        }

        // Starman and invincibility ticks
        if (this.player.invincibilityTick > 0) this.player.invincibilityTick--;
        if (this.player.starmanTick > 0) {
            this.player.starmanTick--;
            if (this.player.starmanTick === 0) {
                window.audio.playLevelMusic(this.currentLevelIndex); // Return to level track
            }
        }

        // Determine physics constants based on environment
        const isWater = this.level.type === 3;
        const grav = isWater ? 0.12 : 0.6;
        const frict = isWater ? 0.94 : 0.85;
        const speedMultiplier = this.keys.run ? 1.7 : 1.0;
        const acc = (isWater ? 0.15 : 0.45) * speedMultiplier;

        // Apply acceleration based on keyboard input
        if (this.keys.left) {
            this.player.vx -= acc;
            this.player.direction = -1;
        } else if (this.keys.right) {
            this.player.vx += acc;
            this.player.direction = 1;
        } else {
            this.player.vx *= frict;
        }

        // Clamp horizontal velocity
        const maxV = (this.keys.run ? 5.5 : 3.5) * (isWater ? 0.5 : 1);
        if (this.player.vx > maxV) this.player.vx = maxV;
        if (this.player.vx < -maxV) this.player.vx = -maxV;

        // Apply gravity
        this.player.vy += grav;
        const maxFall = isWater ? 2.5 : 12;
        if (this.player.vy > maxFall) this.player.vy = maxFall;

        // Run animations tick
        if (this.player.onGround && Math.abs(this.player.vx) > 0.1) {
            this.player.runFrame += Math.abs(this.player.vx) * 0.12;
        }

        // Move Player along X
        this.player.x += this.player.vx;
        this.solveCollisions('x');

        // Move Player along Y
        this.player.y += this.player.vy;
        this.player.onGround = false;
        this.solveCollisions('y');

        // Prevent walking off left of screen camera
        if (this.player.x < this.cameraX) {
            this.player.x = this.cameraX;
            this.player.vx = 0;
        }

        // Pit death
        if (this.player.y > this.canvas.height + 32) {
            this.killPlayer();
        }

        // Flagpole or Ending Door Collision (Win level trigger)
        const flagPixelX = this.level.flagPos * this.tileSize;
        if (this.player.x >= flagPixelX && !this.player.isDying) {
            this.triggerLevelClear();
        }
    }

    killPlayer() {
        if (this.player.isDying) return;
        this.player.isDying = true;
        this.player.vy = -10;
        this.player.deathTick = 0;
        window.audio.playSFX('hurt');
        window.audio.stopMusic();
    }

    damagePlayer() {
        if (this.player.invincibilityTick > 0 || this.player.starmanTick > 0) return;

        if (this.player.state > 0) {
            this.player.state = 0;
            this.setPlayerSize();
            this.player.invincibilityTick = 90; // Flicker damage buffer
            window.audio.playSFX('powerdown');
        } else {
            this.killPlayer();
        }
    }

    growPlayer(type) {
        if (type === 'mushroom' && this.player.state === 0) {
            this.player.state = 1;
            this.player.y -= 10;
            this.setPlayerSize();
            window.audio.playSFX('powerup');
        } else if (type === 'flower') {
            this.player.state = 2;
            if (this.player.state === 0) this.player.y -= 10;
            this.setPlayerSize();
            window.audio.playSFX('powerup');
        } else if (type === 'star') {
            this.player.starmanTick = 600; // 10 seconds of invincibility
            window.audio.playSFX('powerup');
            // Play starman dynamic fast music
            window.audio.stopMusic();
            window.audio.playLevelMusic(2); // cloud tempo as invincibility loop representation
        } else if (type === '1up') {
            this.lives++;
            window.audio.playSFX('powerup');
        }
    }

    // ----------------------------------------------------
    // COLLISION SOLVER (TILEMAP GRID)
    // ----------------------------------------------------
    solveCollisions(axis) {
        const startX = Math.floor(this.player.x / this.tileSize);
        const endX = Math.floor((this.player.x + this.player.width) / this.tileSize);
        const startY = Math.floor(this.player.y / this.tileSize);
        const endY = Math.floor((this.player.y + this.player.height) / this.tileSize);

        for (let r = startY; r <= endY; r++) {
            for (let c = startX; c <= endX; c++) {
                // Out of map bounds check
                if (r < 0 || r >= this.level.rows || c < 0 || c >= this.level.cols) continue;

                const tile = this.level.grid[r][c];
                if (tile === 0 || tile === 11) continue; // air or water do not block movement
                
                // Lava block handles special touch behavior
                if (tile === 10) {
                    if (this.checkAABB(this.player, { x: c*32, y: r*32, width: 32, height: 32 })) {
                        this.killPlayer();
                        return;
                    }
                    continue;
                }

                const tileBox = { x: c * this.tileSize, y: r * this.tileSize, width: this.tileSize, height: this.tileSize };

                if (this.checkAABB(this.player, tileBox)) {
                    if (axis === 'x') {
                        if (this.player.vx > 0) {
                            this.player.x = tileBox.x - this.player.width;
                            this.player.vx = 0;
                        } else if (this.player.vx < 0) {
                            this.player.x = tileBox.x + tileBox.width;
                            this.player.vx = 0;
                        }
                    } else if (axis === 'y') {
                        if (this.player.vy > 0) {
                            this.player.y = tileBox.y - this.player.height;
                            this.player.vy = 0;
                            this.player.onGround = true;
                        } else if (this.player.vy < 0) {
                            // Hitting blocks from below
                            this.player.y = tileBox.y + tileBox.height;
                            this.player.vy = 0;
                            this.handleBlockHit(c, r, tile);
                        }
                    }
                }
            }
        }
    }

    handleBlockHit(col, row, tile) {
        if (tile === 2) { // Breakable Brick
            if (this.player.state > 0) { // Big/Fire breaks brick
                this.level.grid[row][col] = 0;
                window.audio.playSFX('break');
                // Spawn brick shards particles
                this.spawnBrickParticles(col * 32 + 16, row * 32 + 16);
                this.score += 50;
            } else {
                // Small Mario bounces brick
                window.audio.playSFX('kick');
            }
        } else if (tile === 3) { // Question block - coin
            this.level.grid[row][col] = 5; // Change to solid block hit
            window.audio.playSFX('coin');
            this.coins++;
            this.score += 100;
            this.updateHUDValues();
            // Spawn flying coin particle
            this.particles.push({
                x: col * 32 + 8,
                y: row * 32 - 16,
                vx: 0,
                vy: -6,
                life: 30,
                type: 'coin'
            });
        } else if (tile === 4) { // Question block - Powerup (Mushroom/Flower)
            this.level.grid[row][col] = 5;
            window.audio.playSFX('powerup');
            
            // Choose Mushroom or Fireflower depending on Mario's state
            const type = this.player.state === 0 ? 'mushroom' : 'flower';
            this.items.push({
                x: col * 32,
                y: row * 32,
                vx: type === 'mushroom' ? 1.2 : 0,
                vy: 0,
                width: 24,
                height: 24,
                type: type,
                spawnY: (row - 1) * 32,
                state: 'SPAWNING'
            });
        }
    }

    spawnBrickParticles(x, y) {
        const velocities = [
            { x: -1.5, y: -5 },
            { x: 1.5, y: -5 },
            { x: -1.0, y: -3 },
            { x: 1.0, y: -3 }
        ];
        velocities.forEach(v => {
            this.particles.push({
                x: x, y: y,
                vx: v.x, vy: v.y,
                life: 45,
                type: 'brick'
            });
        });
    }

    // ----------------------------------------------------
    // GAME OBJECT UPDATES (ITEMS, ENEMIES, FIREBALLS)
    // ----------------------------------------------------
    updateItems() {
        this.items.forEach(item => {
            if (item.state === 'SPAWNING') {
                item.y -= 0.8; // Grow out of block
                if (item.y <= item.spawnY) {
                    item.state = 'MOVE';
                }
                return;
            }

            // Normal movement physics for mushroom
            if (item.type === 'mushroom') {
                item.vy += 0.5; // gravity
                item.x += item.vx;
                this.solveItemTileCollision(item, 'x');
                item.y += item.vy;
                this.solveItemTileCollision(item, 'y');
            }

            // Check AABB collision with Mario
            if (this.checkAABB(this.player, item)) {
                this.growPlayer(item.type);
                item.dead = true;
                this.score += 1000;
            }
        });

        this.items = this.items.filter(item => !item.dead && item.y < this.canvas.height + 32);
    }

    solveItemTileCollision(item, axis) {
        const startX = Math.floor(item.x / this.tileSize);
        const endX = Math.floor((item.x + item.width) / this.tileSize);
        const startY = Math.floor(item.y / this.tileSize);
        const endY = Math.floor((item.y + item.height) / this.tileSize);

        for (let r = startY; r <= endY; r++) {
            for (let c = startX; c <= endX; c++) {
                if (r < 0 || r >= this.level.rows || c < 0 || c >= this.level.cols) continue;

                const tile = this.level.grid[r][c];
                // Solid tiles blocks mushroom
                if (tile !== 0 && tile !== 11 && tile !== 10) {
                    const tileBox = { x: c * this.tileSize, y: r * this.tileSize, width: this.tileSize, height: this.tileSize };
                    if (this.checkAABB(item, tileBox)) {
                        if (axis === 'x') {
                            item.vx = -item.vx; // Reverse directions
                            item.x = item.vx > 0 ? tileBox.x + tileBox.width : tileBox.x - item.width;
                        } else {
                            if (item.vy > 0) {
                                item.y = tileBox.y - item.height;
                                item.vy = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            const screenDist = enemy.x - this.cameraX;
            if (screenDist > 900) return; // Keep offscreen enemies frozen

            // Bowser logic
            if (enemy.type === 'bowser') {
                this.updateBowser(enemy);
                return;
            }

            // Thwomp Stone Drop Logic
            if (enemy.type === 'thwomp') {
                const playerDistX = Math.abs(this.player.x - enemy.x);
                if (enemy.state === 'WALK') { // idle hanging on ceiling
                    if (playerDistX < 48 && this.player.x > enemy.x - 32) {
                        enemy.state = 'DROP';
                        enemy.vy = 0;
                    }
                } else if (enemy.state === 'DROP') {
                    enemy.vy += 0.8;
                    enemy.y += enemy.vy;
                    // Check hitting ground
                    const bottomTileY = Math.floor((enemy.y + enemy.height) / 32);
                    const centerTileX = Math.floor((enemy.x + enemy.width/2) / 32);
                    if (this.level.grid[bottomTileY][centerTileX] !== 0) {
                        enemy.state = 'RISE';
                        enemy.vy = 0;
                        window.audio.playSFX('stomp'); // Thud vibration
                    }
                } else if (enemy.state === 'RISE') {
                    enemy.y -= 0.8;
                    if (enemy.y <= 128) { // returned to top
                        enemy.y = 128;
                        enemy.state = 'WALK';
                    }
                }
                
                // Damage player if touched
                if (this.checkAABB(this.player, enemy)) {
                    this.damagePlayer();
                }
                return;
            }

            // Normal enemy physics (Goombas, Koopas, Paratroopas, Bloopers, Cheep Cheeps)
            if (enemy.type === 'paratroopa') {
                // flying jump bounce
                enemy.vy += 0.3;
                enemy.x += enemy.vx;
                this.solveItemTileCollision(enemy, 'x');
                enemy.y += enemy.vy;
                this.solveItemTileCollision(enemy, 'y');
                if (enemy.vy === 0) enemy.vy = -6.5; // bounce up
            } else if (enemy.type === 'blooper') {
                // swimming drift towards player direction
                enemy.stateTimer++;
                if (enemy.stateTimer % 90 === 0) {
                    enemy.vx = (this.player.x - enemy.x) * 0.018;
                    enemy.vy = -3.5;
                }
                enemy.vy += 0.1; // lighter buoyancy
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;
            } else if (enemy.type === 'cheep_cheep') {
                // simple swim sideways
                enemy.x += enemy.vx;
            } else {
                // Regular walking Goombas/Koopas
                enemy.vy += 0.5;
                enemy.x += enemy.vx;
                this.solveItemTileCollision(enemy, 'x');
                enemy.y += enemy.vy;
                this.solveItemTileCollision(enemy, 'y');
            }

            // AABB stomp collision with player
            if (this.checkAABB(this.player, enemy)) {
                if (this.player.vy > 0.5 && !enemy.isDead && enemy.type !== 'cheep_cheep') {
                    // Stomp enemy
                    this.player.vy = -7.5; // bounce player
                    this.score += 200;
                    
                    if (enemy.type === 'goomba') {
                        enemy.isDead = true;
                        window.audio.playSFX('stomp');
                    } else if (enemy.type === 'koopa') {
                        enemy.type = 'koopa_shell';
                        enemy.vx = 0;
                        window.audio.playSFX('stomp');
                    } else if (enemy.type === 'paratroopa') {
                        enemy.type = 'koopa'; // drop wings
                        enemy.vx = -0.8;
                        window.audio.playSFX('stomp');
                    } else if (enemy.type === 'koopa_shell') {
                        // Kick static shell
                        enemy.vx = this.player.x < enemy.x ? 6.5 : -6.5;
                        window.audio.playSFX('kick');
                    }
                } else {
                    // Kick shell or damage Mario
                    if (enemy.type === 'koopa_shell' && enemy.vx === 0) {
                        enemy.vx = this.player.x < enemy.x ? 6.5 : -6.5;
                        window.audio.playSFX('kick');
                    } else {
                        if (this.player.starmanTick > 0) {
                            enemy.isDead = true; // star destroys instantly
                            window.audio.playSFX('kick');
                        } else {
                            this.damagePlayer();
                        }
                    }
                }
            }

            // Shell hitting other enemies logic
            if (enemy.type === 'koopa_shell' && Math.abs(enemy.vx) > 1) {
                this.enemies.forEach(other => {
                    if (other !== enemy && !other.isDead && this.checkAABB(enemy, other)) {
                        other.isDead = true;
                        window.audio.playSFX('kick');
                        this.score += 500;
                    }
                });
            }
        });

        // Filter out crushed enemies
        this.enemies = this.enemies.filter(e => !e.isDead && e.y < this.canvas.height + 32);
    }

    updateBowser(bowser) {
        bowser.stateTimer++;

        // Walk back and forth slightly
        if (bowser.stateTimer % 180 === 0) {
            bowser.vx = -bowser.vx;
            bowser.direction = bowser.vx < 0 ? -1 : 1;
        }
        bowser.x += bowser.vx;

        // Bowser Jumps
        if (bowser.stateTimer % 220 === 100) {
            bowser.vy = -8.5;
        }
        bowser.vy += 0.35; // gravity
        bowser.y += bowser.vy;

        // Ground lock
        if (bowser.y > 320) {
            bowser.y = 320;
            bowser.vy = 0;
        }

        // Shoot fireballs (Breathing fire)
        if (bowser.stateTimer % 160 === 0) {
            this.projectiles.push({
                x: bowser.x - 20,
                y: bowser.y + 15,
                vx: -3.5,
                vy: Math.sin(this.tick * 0.1) * 1.5, // wave path
                width: 24,
                height: 12,
                type: 'bowser_fire'
            });
            window.audio.playSFX('fireball');
        }

        // Check damage from Fireballs
        this.projectiles.forEach(proj => {
            if (proj.type === 'fireball' && this.checkAABB(proj, bowser)) {
                proj.dead = true;
                bowser.hp--;
                window.audio.playSFX('bowser_hurt');
                this.score += 200;

                // Flash red or damage feedback
                if (bowser.hp <= 0) {
                    bowser.isDead = true;
                    // Spawn Bowser boss defeat effect
                    this.score += 5000;
                    this.triggerLevelClear();
                }
            }
        });

        // Touch damage Mario
        if (this.checkAABB(this.player, bowser)) {
            if (this.player.starmanTick > 0) {
                bowser.hp -= 2;
                this.player.vy = -6; // bounce player
                window.audio.playSFX('bowser_hurt');
            } else {
                this.damagePlayer();
            }
        }
    }

    updateProjectiles() {
        this.projectiles.forEach(proj => {
            proj.x += proj.vx;
            proj.y += proj.vy;

            if (proj.type === 'fireball') {
                // Gravity / bounce on ground tiles
                proj.vy += 0.4;
                
                // Solve tile bouncing
                const startX = Math.floor(proj.x / this.tileSize);
                const endX = Math.floor((proj.x + proj.width) / this.tileSize);
                const startY = Math.floor(proj.y / this.tileSize);
                const endY = Math.floor((proj.y + proj.height) / this.tileSize);

                for (let r = startY; r <= endY; r++) {
                    for (let c = startX; c <= endX; c++) {
                        if (r < 0 || r >= this.level.rows || c < 0 || c >= this.level.cols) continue;

                        const tile = this.level.grid[r][c];
                        if (tile !== 0 && tile !== 11 && tile !== 10) {
                            const tileBox = { x: c*32, y: r*32, width: 32, height: 32 };
                            if (this.checkAABB(proj, tileBox)) {
                                // Hit wall -> explode, or hit floor -> bounce
                                if (proj.y + proj.height - proj.vy <= tileBox.y + 4) {
                                    proj.y = tileBox.y - proj.height;
                                    proj.vy = -4.5; // Bounce up
                                } else {
                                    proj.dead = true;
                                }
                            }
                        }
                    }
                }

                // Check hitting regular enemies
                this.enemies.forEach(enemy => {
                    if (enemy.type !== 'thwomp' && this.checkAABB(proj, enemy)) {
                        proj.dead = true;
                        enemy.isDead = true;
                        window.audio.playSFX('kick');
                        this.score += 200;
                    }
                });
            } else if (proj.type === 'bowser_fire') {
                // Simply burns player
                if (this.checkAABB(this.player, proj)) {
                    this.damagePlayer();
                }
            }

            // Clean up out of bounds projectiles
            const range = proj.x - this.cameraX;
            if (range < -32 || range > 850 || proj.y > this.canvas.height) {
                proj.dead = true;
            }
        });

        this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    updateParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.type === 'brick') {
                p.vy += 0.45; // gravity on shard
            }
            p.life--;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    updateCamera() {
        // Horizontal camera scroll following player position
        const targetCamX = this.player.x - 300;
        if (targetCamX > this.cameraX) {
            this.cameraX = targetCamX;
        }

        // Limit camera to end of level
        const maxScroll = (this.level.cols * this.tileSize) - this.canvas.width;
        if (this.cameraX > maxScroll) this.cameraX = maxScroll;
        if (this.cameraX < 0) this.cameraX = 0;
    }

    // ----------------------------------------------------
    // WIN / LOSS OVERLAYS
    // ----------------------------------------------------
    triggerLevelClear() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.state = 'VICTORY';
        window.audio.playSFX('stageclear');
        
        // Unlock next stage
        const nextIdx = this.currentLevelIndex + 1;
        if (nextIdx < 5) {
            this.unlockedLevels[nextIdx] = true;
        }

        setTimeout(() => {
            const nextBtn = document.getElementById('nextLevelBtn');
            if (this.currentLevelIndex === 4) {
                // Game beat!
                document.getElementById('victoryText').innerText = "CONGRATULATIONS!\nYOU SAVED THE PRINCESS!";
                nextBtn.classList.add('hidden');
            } else {
                document.getElementById('victoryText').innerText = `STAGE ${this.currentLevelIndex + 1} CLEARED!`;
                nextBtn.classList.remove('hidden');
            }
            
            // Fill stats
            document.getElementById('statScore').innerText = String(this.score).padStart(6, '0');
            document.getElementById('statCoins').innerText = String(this.coins).padStart(2, '0');
            document.getElementById('statTime').innerText = String(this.timeLeft);

            document.getElementById('victoryScreen').classList.remove('hidden');
        }, 1500);
    }

    triggerGameOver() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.state = 'GAMEOVER';
        window.audio.playSFX('gameover');

        setTimeout(() => {
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }, 1000);
    }

    exitToMenu() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.state = 'MENU';
        window.audio.stopMusic();
        
        // Re-enable levels buttons based on unlocks
        for (let i = 0; i < 5; i++) {
            const btn = document.getElementById(`lvlBtn${i}`);
            if (btn) {
                if (this.unlockedLevels[i]) {
                    btn.classList.remove('locked');
                    btn.querySelector('.level-num').innerText = `WORLD 1-${i+1}`;
                } else {
                    btn.classList.add('locked');
                    btn.querySelector('.level-num').innerText = `LOCKED`;
                }
            }
        }

        document.getElementById('startMenu').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('victoryScreen').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
    }

    // ----------------------------------------------------
    // RENDERING / RENDERS LOOP
    // ----------------------------------------------------
    draw() {
        if (this.state === 'MENU') return;

        // Clear view context
        this.ctx.fillStyle = this.level.skyColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        // Translate view by scroll offset
        this.ctx.translate(-Math.floor(this.cameraX), 0);

        // 1. Draw scenery backgrounds
        this.level.scenery.forEach(scene => {
            window.sprites.drawBackdecor(this.ctx, scene.type, scene.x, scene.y, this.tick);
        });

        // 2. Draw active firebars (Castle hazards)
        this.firebars.forEach(f => {
            const angle = this.tick * f.speed;
            const cx = f.x * 32 + 16;
            const cy = f.y * 32 + 16;
            for (let i = 0; i < f.length; i++) {
                const dist = i * 14;
                const bx = cx + Math.cos(angle) * dist;
                const by = cy + Math.sin(angle) * dist;
                window.sprites.drawItem(this.ctx, 'fireball', this.tick + i*5, bx - 6, by - 6, 12);
            }
            // Center pin block
            window.sprites.drawTile(this.ctx, 5, f.x * 32, f.y * 32, 32, this.tick, 4);
        });

        // 3. Draw level tile grid within camera window
        const colStart = Math.max(0, Math.floor(this.cameraX / this.tileSize));
        const colEnd = Math.min(this.level.cols - 1, Math.floor((this.cameraX + this.canvas.width) / this.tileSize) + 1);

        for (let r = 0; r < this.level.rows; r++) {
            for (let c = colStart; c <= colEnd; c++) {
                const tile = this.level.grid[r][c];
                if (tile !== 0) {
                    window.sprites.drawTile(this.ctx, tile, c * this.tileSize, r * this.tileSize, this.tileSize, this.tick, this.level.type);
                }
            }
        }

        // 4. Draw flagpole and castle doors
        const flagX = this.level.flagPos * this.tileSize;
        // flagpole stem
        this.ctx.fillStyle = '#cfcfcf';
        this.ctx.fillRect(flagX + 14, 64, 4, 320);
        // flagpole green ball
        this.ctx.fillStyle = '#00a800';
        this.ctx.beginPath();
        this.ctx.arc(flagX + 16, 60, 6, 0, Math.PI*2);
        this.ctx.fill();
        // flagpole flag
        this.ctx.fillStyle = '#ffffff';
        const waveFlag = Math.sin(this.tick * 0.08) * 3;
        this.ctx.fillRect(flagX - 16, 80 + waveFlag, 30, 20);
        this.ctx.fillStyle = '#e52521'; // red emblem spot
        this.ctx.fillRect(flagX - 8, 86 + waveFlag, 8, 8);

        // 5. Draw spawning items
        this.items.forEach(item => {
            window.sprites.drawItem(this.ctx, item.type, this.tick, item.x, item.y, item.width);
        });

        // 6. Draw active projectiles
        this.projectiles.forEach(proj => {
            if (proj.type === 'fireball') {
                window.sprites.drawItem(this.ctx, 'fireball', this.tick, proj.x, proj.y, proj.width);
            } else if (proj.type === 'bowser_fire') {
                // Drawing flame sprite waves
                this.ctx.fillStyle = '#ff3b30';
                this.ctx.beginPath();
                this.ctx.ellipse(proj.x + 12, proj.y + 6, 12, 6, 0, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ffea00';
                this.ctx.beginPath();
                this.ctx.ellipse(proj.x + 12, proj.y + 6, 8, 3, 0, 0, Math.PI*2);
                this.ctx.fill();
            }
        });

        // 7. Draw active enemies
        this.enemies.forEach(enemy => {
            window.sprites.drawEnemy(this.ctx, enemy.type, this.tick + enemy.x, enemy.x, enemy.y, enemy.width, enemy.height, enemy.direction);
        });

        // 8. Draw particles
        this.particles.forEach(p => {
            if (p.type === 'coin') {
                window.sprites.drawItem(this.ctx, 'coin', this.tick, p.x, p.y, 16);
            } else if (p.type === 'brick') {
                this.ctx.fillStyle = '#a81000';
                this.ctx.fillRect(p.x, p.y, 8, 6);
            }
        });

        // 9. Draw player Mario
        window.sprites.drawMario(
            this.ctx,
            this.player.state,
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height,
            this.player.direction,
            this.keys,
            this.player.runFrame,
            this.player.invincibilityTick
        );

        this.ctx.restore();

        // 10. Draw overlay HUD elements in real time
        this.drawHUDText();
    }

    drawHUDText() {
        // Updates HUD values in layout elements
        document.getElementById('hudScore').innerText = String(this.score).padStart(6, '0');
        document.getElementById('hudCoins').innerText = String(this.coins).padStart(2, '0');
        document.getElementById('hudLevelName').innerText = this.level.name.split(':')[0];
        document.getElementById('hudTime').innerText = String(this.timeLeft).padStart(3, '0');
    }

    // ----------------------------------------------------
    // HELPERS
    // ----------------------------------------------------
    checkAABB(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    updateHUDValues() {
        this.drawHUDText();
    }
}

// Instantiate on startup
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MarioGame('gameCanvas');
});
