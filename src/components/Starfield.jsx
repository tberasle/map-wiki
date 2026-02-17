import React, { useRef, useEffect } from 'react';

const Starfield = ({ warpMode, origin, settings }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    // Use ref to hold latest settings without re-triggering effect
    const settingsRef = useRef(settings);

    // Update ref when settings change
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // Star data
    const starsRef = useRef([]);
    const canvasSize = useRef({ w: 0, h: 0 });
    const startWarpTime = useRef(0);
    const originRef = useRef({ x: 50, y: 50 });

    // Reset timer on warp start
    useEffect(() => {
        if (warpMode === 'zooming-in' || warpMode === 'zooming-out') {
            startWarpTime.current = Date.now();
        } else if (!warpMode) {
            startWarpTime.current = 0;
        }
    }, [warpMode]);

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
            // Default settings from ref
            const currentSettings = settingsRef.current || {};
            const starColor = currentSettings.starColor || '#ffffff';
            const bgColor = currentSettings.bgColor || 'transparent';
            const speed = currentSettings.speed !== undefined ? currentSettings.speed : 0;
            const twinkleSpeed = currentSettings.twinkleSpeed !== undefined ? currentSettings.twinkleSpeed : 0.5;

            // Resize Logic
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                canvasSize.current = { w: canvas.width, h: canvas.height };
            }

            const { w, h } = canvasSize.current;

            // Interpolate Origin (Sustain last origin if null)
            let targetX = originRef.current.x;
            let targetY = originRef.current.y;

            if (origin) {
                targetX = origin.x;
                targetY = origin.y;
            } else {
                // When idle/null, just drift VERY slowly back to center?
                // Or stay put? User wants NO jerk. Stay put is safest.
                // But if we want subtle reset:
                // targetX = 50; targetY = 50; 
                // and use super slow factor 0.01?
                // User said "jerk shouldn't happen at all".
                // I'll stick to staying put.
                targetX = originRef.current.x;
                targetY = originRef.current.y;
            }

            // Rapidly move to new target effectively snapping near instant if factor is high, 
            // or smooth if 0.1. A warp click usually implies immediate focus.
            // Let's use 0.2 for responsiveness.
            originRef.current.x += (targetX - originRef.current.x) * 0.2;
            originRef.current.y += (targetY - originRef.current.y) * 0.2;

            const cx = (originRef.current.x / 100) * w;
            const cy = (originRef.current.y / 100) * h;

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

            // Override if duration exceeded (0.7s)
            if (startWarpTime.current > 0 && (Date.now() - startWarpTime.current > 200)) {
                targetSpeed = speed;
            }

            // Lerp current speed towards target
            // Initialize if undefined
            if (starsRef.current.speed === undefined) {
                starsRef.current.speed = speed;
            }

            // Smoothly interpolate
            starsRef.current.speed += (targetSpeed - starsRef.current.speed) * 0.025;

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
        return () => cancelAnimationFrame(requestRef.current);
    }, [warpMode, origin]); // Re-bind ONLY if warp/origin change. Settings are handled via ref.

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
