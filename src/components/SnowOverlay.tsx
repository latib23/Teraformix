import React, { useEffect, useRef } from 'react';

const SnowOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const flakes: { x: number; y: number; r: number; d: number; }[] = [];
        const maxFlakes = 100; // Adjust for density

        for (let i = 0; i < maxFlakes; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 3 + 1, // radius
                d: Math.random() * maxFlakes // density
            });
        }

        let animationFrameId: number;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            for (let i = 0; i < maxFlakes; i++) {
                const f = flakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();
            update();
            animationFrameId = requestAnimationFrame(draw);
        };

        const update = () => {
            let angle = 0;
            for (let i = 0; i < maxFlakes; i++) {
                angle += 0.01;
                const f = flakes[i];
                // Update Y position
                f.y += Math.pow(f.d, 2) + 1;
                // Update X position (sway)
                f.x += Math.sin(angle) * 2;

                // Reset if off bottom
                if (f.y > height) {
                    flakes[i] = { x: Math.random() * width, y: 0, r: f.r, d: f.d };
                }
                // Wrap if off sides (optional, but good for sway)
                if (f.x > width + 5 || f.x < -5) {
                    if (f.x > width + 5) flakes[i].x = -5;
                    if (f.x < -5) flakes[i].x = width + 5;
                }
            }
        };

        // Better update logic for realistic fall
        const updateReal = () => {
            for (let i = 0; i < maxFlakes; i++) {
                const f = flakes[i];
                f.y += Math.cos(f.d) + 1 + f.r / 2;
                f.x += Math.sin(f.d) * 2;

                if (f.y > height) {
                    flakes[i] = { x: Math.random() * width, y: -10, r: f.r, d: f.d };
                }
            }
        }

        const loop = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#E1F5FE"; // Icy Light Blue for visibility
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            ctx.beginPath();
            for (let i = 0; i < maxFlakes; i++) {
                const f = flakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();

            // Update positions
            for (let i = 0; i < maxFlakes; i++) {
                const f = flakes[i];
                f.y += Math.cos(f.d) + 1 + f.r / 2;
                f.x += Math.sin(f.d) * 0.5; // smoother sway

                if (f.y > height) {
                    flakes[i] = { x: Math.random() * width, y: -10, r: f.r, d: Math.random() * maxFlakes };
                }
                // Wrap X
                if (f.x > width) flakes[i].x = 0;
                if (f.x < 0) flakes[i].x = width;
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]"
            style={{ pointerEvents: 'none' }}
        />
    );
};

export default SnowOverlay;
