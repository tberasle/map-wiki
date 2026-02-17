import React, { useState, useEffect, useRef } from 'react';
import Starfield from './Starfield';

// --- Utility Functions for Color Interpolation ---

// Parse hex to {r, g, b}
const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
};

// Convert {r, g, b} to hex
const rgbToHex = ({ r, g, b }) => {
    return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

// Lerp between two numbers
const lerp = (start, end, t) => {
    return start * (1 - t) + end * t;
};

// Lerp between two hex colors
const lerpColor = (startHex, endHex, t) => {
    const start = hexToRgb(startHex);
    const end = hexToRgb(endHex);
    const r = lerp(start.r, end.r, t);
    const g = lerp(start.g, end.g, t);
    const b = lerp(start.b, end.b, t);
    return rgbToHex({ r, g, b });
};

const VisualEffects = ({ targetSettings, warpMode, origin }) => {
    // Current display settings (interpolated values)
    const [displaySettings, setDisplaySettings] = useState(targetSettings);

    // Ref to hold current values for animation loop (avoids stale closures)
    const currentRef = useRef(targetSettings);
    const targetRef = useRef(targetSettings);

    // Update target ref when props change
    useEffect(() => {
        targetRef.current = targetSettings;
    }, [targetSettings]);

    // Animation Loop
    useEffect(() => {
        let animationFrameId;

        const animate = () => {
            const current = currentRef.current;
            const target = targetRef.current;

            let needsUpdate = false;
            const nextSettings = { ...current };
            const factor = 0.05; // Smoothing factor (lower = slower)

            // Helper to interpolate a numeric property
            const interpolateProp = (key, snapThreshold = 0.01) => {
                const val = current[key] !== undefined ? current[key] : (target[key] || 0);
                const tgt = target[key] !== undefined ? target[key] : 0;

                if (Math.abs(val - tgt) > snapThreshold) {
                    needsUpdate = true;
                    nextSettings[key] = lerp(val, tgt, factor);
                } else if (val !== tgt) {
                    needsUpdate = true;
                    nextSettings[key] = tgt; // Snap
                }
            };

            // Interpolate Star Color
            if (current.starColor !== target.starColor) {
                needsUpdate = true;
                // Simple check logic: convert to RGB to dist check? 
                // Or just always lerp if string differs until very close?
                // Let's just blindly lerp colors. 
                // But we need to know if we are "close enough".
                // Just stick to factor. 
                // To avoid infinite small updates, maybe check if rgb values are close?
                // Let's rely on string comparison after round-trip?
                // Actually, let's store RGB in ref for precision if needed?
                // For simplicity, we just lerp.
                const nextColor = lerpColor(current.starColor, target.starColor, factor);
                if (nextColor !== current.starColor) {
                    nextSettings.starColor = nextColor;
                    if (nextColor === target.starColor) {
                        // snapped?
                    }
                }
            }

            // Interpolate Nebula Color
            if (current.nebulaColor !== target.nebulaColor) {
                needsUpdate = true;
                nextSettings.nebulaColor = lerpColor(current.nebulaColor || '#000000', target.nebulaColor || '#000000', factor);
            }

            // Interpolate Numbers
            interpolateProp('speed');
            interpolateProp('twinkleSpeed');
            interpolateProp('nebulaIntensity');

            if (needsUpdate) {
                currentRef.current = nextSettings;
                setDisplaySettings(nextSettings);
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // If we are done, maybe stop loop?
                // But we need to check if target changes later.
                // The effect dependency usually handles start.
                // But here we want a continuous loop? 
                // No, just loop if we aren't at target.
                // If we settled, we stop.
                // But we need to Listen for changes in targetRef.
                // A loop that runs 60fps *always* is easiest for React 18 concurrent mode handling?
                // Or just:
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []); // Run once, refs handle updates

    return (
        <React.Fragment>
            <Starfield
                warpMode={warpMode}
                origin={origin}
                settings={displaySettings}
            />
            {/* Nebula Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                background: `radial-gradient(circle at 50% 50%, ${displaySettings.nebulaColor || '#4c1d95'}, transparent 70%)`,
                opacity: displaySettings.nebulaIntensity !== undefined ? displaySettings.nebulaIntensity : 0.3,
                mixBlendMode: 'screen',
                transition: 'none' // We handle transition manually
            }} />
        </React.Fragment>
    );
};

export default VisualEffects;
