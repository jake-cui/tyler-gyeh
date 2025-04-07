document.addEventListener('DOMContentLoaded', () => {
    // Secret keyword detection
    let typedKeys = '';
    const secretSound = document.getElementById('secret-sound');
    
    document.addEventListener('keydown', (e) => {
        typedKeys += e.key.toLowerCase();
        // Only keep the last 6 characters (length of 'peanut')
        if (typedKeys.length > 6) {
            typedKeys = typedKeys.slice(-6);
        }
        
        if (typedKeys === 'peanut') {
            secretSound.currentTime = 0; // Reset the sound to start
            secretSound.play().catch(error => {
                console.log('Secret sound playback failed:', error);
            });
            typedKeys = ''; // Reset the typed keys
        }
    });

    const headsContainer = document.getElementById('heads-container');
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = musicToggle.querySelector('.music-icon');
    const backgroundMusic = document.getElementById('background-music');
    let isPlaying = false;
    let heads = [];
    let mouseDownTime = null;
    let currentHead = null;
    let animationFrame;

    // Add pulsing animation to music button initially
    musicToggle.classList.add('pulse');

    function startMusic() {
        if (!isPlaying) {
            backgroundMusic.play().then(() => {
                isPlaying = true;
                musicIcon.textContent = '🔊';
                musicToggle.classList.add('playing');
                musicToggle.classList.remove('pulse');
            }).catch(error => {
                console.log('Audio playback failed:', error);
            });
        }
    }

    // Attempt to autoplay music on first interaction
    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });
    document.addEventListener('touchstart', startMusic, { once: true });

    // Music control
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent creating a head when clicking the music button
        if (isPlaying) {
            backgroundMusic.pause();
            musicIcon.textContent = '🔈';
        } else {
            backgroundMusic.play().catch(error => {
                console.log('Audio playback failed:', error);
            });
            musicIcon.textContent = '🔊';
        }
        isPlaying = !isPlaying;
        musicToggle.classList.toggle('playing');
    });

    class BouncingHead {
        constructor(x, y, size) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.targetSize = size;
            this.growthStart = Date.now();
            this.dx = 0;
            this.dy = 0;
            this.rotation = 0;
            this.isGrowing = true;
            this.element = document.createElement('img');
            this.element.src = 'head.png';
            this.element.className = 'bouncing-head';
            this.updateSize(size);
            headsContainer.appendChild(this.element);
        }

        startMoving() {
            this.isGrowing = false;
            // Set random velocity only when released
            this.dx = (Math.random() - 0.5) * 10;
            this.dy = (Math.random() - 0.5) * 10;
        }

        updateSize(newSize) {
            this.size = newSize;
            this.element.style.width = `${newSize}px`;
            this.element.style.height = `${newSize}px`;
            // Adjust position to keep the head centered at the mouse
            this.element.style.marginLeft = `-${newSize / 2}px`;
            this.element.style.marginTop = `-${newSize / 2}px`;
        }

        update() {
            // Smooth size interpolation
            if (this.isGrowing && this.size !== this.targetSize) {
                this.size = this.size + (this.targetSize - this.size) * 0.3;
                if (Math.abs(this.size - this.targetSize) < 0.1) {
                    this.size = this.targetSize;
                }
                this.updateSize(this.size);
            }

            if (!this.isGrowing) {
                this.x += this.dx;
                this.y += this.dy;
                this.rotation += 2;

                // Bounce off walls
                if (this.x <= this.size/2 || this.x >= window.innerWidth - this.size/2) {
                    this.dx = -this.dx;
                    this.x = Math.max(this.size/2, Math.min(window.innerWidth - this.size/2, this.x));
                }
                if (this.y <= this.size/2 || this.y >= window.innerHeight - this.size/2) {
                    this.dy = -this.dy;
                    this.y = Math.max(this.size/2, Math.min(window.innerHeight - this.size/2, this.y));
                }
            }

            this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
        }
    }

    function animate() {
        heads.forEach(head => head.update());
        animationFrame = requestAnimationFrame(animate);
    }

    let growthInterval;

    // Function to start head creation and growth
    function startGrowing(x, y) {
        if (currentHead) return; // Prevent multiple heads
        mouseDownTime = Date.now();
        currentHead = new BouncingHead(x, y, 100);
        heads.push(currentHead);
        
        // Start continuous growth
        growthInterval = setInterval(() => {
            if (currentHead && currentHead.size < 400) {
                currentHead.targetSize = Math.min(currentHead.size + 5, 400);
            }
        }, 16); // Update roughly every frame
    }

    // Function to stop growing and start movement
    function stopGrowing() {
        if (currentHead) {
            currentHead.startMoving();
        }
        clearInterval(growthInterval);
        mouseDownTime = null;
        currentHead = null;
    }

    // Mouse events
    document.addEventListener('mousedown', (e) => {
        if (e.target === musicToggle || e.target.parentElement === musicToggle) return;
        e.preventDefault(); // Prevent unwanted selection
        startGrowing(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', stopGrowing);

    // Touch events
    document.addEventListener('touchstart', (e) => {
        if (e.target === musicToggle || e.target.parentElement === musicToggle) return;
        e.preventDefault(); // Prevent scrolling while touching
        const touch = e.touches[0];
        startGrowing(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopGrowing();
    }, { passive: false });

    // Prevent unwanted touch behaviors
    document.addEventListener('touchmove', (e) => {
        if (currentHead) e.preventDefault();
    }, { passive: false });

    // Remove mousemove handler as we're using interval-based growth

    // Start animation loop
    animate();
});
