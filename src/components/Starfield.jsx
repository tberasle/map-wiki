import React, { useRef, useEffect } from 'react';

const Starfield = ({ warpMode, origin, settings }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    // Default settings
    const starColor = settings?.starColor || '#ffffff';
    const bgColor = settings?.bgColor || 'transparent';
    const speed = settings?.speed !== undefined ? settings.speed : 1;
    const twinkleSpeed = settings?.twinkleSpeed !== undefined ? settings.twinkleSpeed : 0.5;

    // Star data
    const starsRef = useRef([]);
    const canvasSize = useRef({ w: 0, h: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Initialize Stars
        const initStars = (count) => {
            const stars = [];
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * 2000 - 1000,
                    y: Math.random() * 2000 - 1000,
                    z: Math.random() * 1000,
                    pz: 0, // Previous Z (for trails)
                    offset: Math.random() * 100 // For twinkle phase
                });
            }
            return stars;
        };

        if (starsRef.current.length === 0) {
            starsRef.current = initStars(800);
        }

        const render = () => {
            // Resize Logic
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                canvasSize.current = { w: canvas.width, h: canvas.height };
            }

            const { w, h } = canvasSize.current;
            const cx = origin ? (origin.x / 100) * w : w / 2;
            const cy = origin ? (origin.y / 100) * h : h / 2;

            // Clear
            ctx.fillStyle = bgColor;
            ctx.clearRect(0, 0, w, h);
            // Optional: Fill bg color if not transparent
            if (bgColor !== 'transparent') {
                ctx.fillRect(0, 0, w, h);
            }

            // Update Speed based on Warp Mode with Ramping
            let targetSpeed = 0;
            if (warpMode === 'zooming-in' || warpMode === 'entering-in') {
                targetSpeed = 50;
            } else if (warpMode === 'zooming-out' || warpMode === 'entering-out') {
                targetSpeed = -50;
            } else {
                targetSpeed = speed; // Default speed (0 or user set)
            }

            // Lerp current speed towards target
            // Initialize if undefined
            if (starsRef.current.speed === undefined) {
                starsRef.current.speed = speed;
            }

            // Smoothly interpolate
            starsRef.current.speed += (targetSpeed - starsRef.current.speed) * 0.05;

            // If very close to 0, snap to 0 to allow perfect static twinkling
            if (Math.abs(starsRef.current.speed) < 0.01 && targetSpeed === 0) {
                starsRef.current.speed = 0;
            }

            const currentSpeed = starsRef.current.speed;

            const stars = starsRef.current;
            const time = Date.now() * 0.005;

            ctx.fillStyle = starColor;
            ctx.lineWidth = currentSpeed > 10 ? 2 : 1; // Thicker lines for warp
            ctx.strokeStyle = starColor;

            stars.forEach(star => {
                // Update Z
                star.z -= currentSpeed;

                // Reset if out of bounds
                if (star.z < 1) {
                    star.z = 1000;
                    star.x = Math.random() * 2000 - 1000;
                    star.y = Math.random() * 2000 - 1000;
                    star.pz = 1000;
                } else if (star.z > 1000) {
                    star.z = 1;
                    star.x = Math.random() * 2000 - 1000;
                    star.y = Math.random() * 2000 - 1000;
                    star.pz = 1;
                }

                // Project
                const k = 128.0 / star.z;
                const px = (star.x * k) + cx;
                const py = (star.y * k) + cy;

                if (px >= 0 && px <= w && py >= 0 && py <= h) {
                    const size = (1 - star.z / 1000) * 3;

                    // Twinkle Logic
                    let alpha = 1;
                    if (Math.abs(currentSpeed) < 5) {
                        // Static -> Twinkle
                        const val = Math.sin(time * twinkleSpeed + (star.offset || 0));
                        alpha = 0.5 + (val * 0.5);
                    }

                    ctx.globalAlpha = alpha;

                    if (Math.abs(currentSpeed) > 10) {
                        // Warp Trails
                        const pk = 128.0 / (star.z + currentSpeed * 0.5); // "Tail" magnitude
                        const ppx = (star.x * pk) + cx;
                        const ppy = (star.y * pk) + cy;

                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(ppx, ppy);
                        ctx.stroke();
                    } else {
                        // Dot
                        ctx.fillRect(px, py, size, size);
                    }
                    ctx.globalAlpha = 1.0; // Reset
                }
            });

            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);

        return () => cancelAnimationFrame(requestRef.current);
    }, [warpMode, origin, settings]); // Re-bind if these change

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed', // Fixed to cover detailed placeholder etc
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0 // Behind everything (MapCanvas needs z-index 1 or just rely on DOM order)
            }}
        />
    );
};

export default Starfield;
