import React, { useRef, useEffect } from 'react';

const HardwareAnimation = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width;
        let height = canvas.height;
        let particles: Particle[] = [];
        let animationFrameId: number = 0;

        // Configuration
        const particleCount = 60;
        const connectionDistance = 150;
        const mouseParams = { x: 0, y: 0, radius: 200 };

        class Particle {
            x: number;
            y: number;
            directionX: number;
            directionY: number;
            size: number;
            color: string;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.directionX = (Math.random() * 0.4) - 0.2;
                this.directionY = (Math.random() * 0.4) - 0.2;
                this.size = Math.random() * 2 + 1;
                this.color = '#10B981'; // Emerald/Action color
            }

            update() {
                // Boundary check
                if (this.x > width || this.x < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y > height || this.y < 0) {
                    this.directionY = -this.directionY;
                }

                // Mouse interaction
                let dx = mouseParams.x - this.x;
                let dy = mouseParams.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseParams.radius) {
                    if (mouseParams.x < this.x && this.x < width - 10) {
                        this.x += 2; // Move away from mouse
                    }
                    if (mouseParams.x > this.x && this.x > 10) {
                        this.x -= 2;
                    }
                    if (mouseParams.y < this.y && this.y < height - 10) {
                        this.y += 2;
                    }
                    if (mouseParams.y > this.y && this.y > 10) {
                        this.y -= 2;
                    }
                }

                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        function init() {
            if (!containerRef.current || !canvas) return;

            // Set canvas size to container size
            width = containerRef.current.clientWidth;
            height = containerRef.current.clientHeight;
            canvas.width = width;
            canvas.height = height;

            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            if (!ctx || !canvas) return;
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            connect();
        }

        function connect() {
            if (!ctx) return;
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) +
                        ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));

                    if (distance < (connectionDistance * connectionDistance)) {
                        opacityValue = 1 - (distance / 20000);
                        ctx.strokeStyle = 'rgba(16, 185, 129, ' + opacityValue * 0.4 + ')'; // Emerald with opacity
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Resize Event
        const handleResize = () => {
            init();
        };

        // Mouse Event
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseParams.x = e.clientX - rect.left;
            mouseParams.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouseParams.x = -1000;
            mouseParams.y = -1000;
        }

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (canvas) {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseleave', handleMouseLeave);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas ref={canvasRef} className="block w-full h-full opacity-60" />
        </div>
    );
};

export default HardwareAnimation;
