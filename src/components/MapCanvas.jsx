import React, { useState, useRef, useEffect } from 'react';
import Pin from './Pin';

const MapCanvas = ({ mapImage, pins = [], onAddPin, onSelectPin, selectedPinId, onContextMenu, onPinContextMenu, isEditing, onPinMove, connectingSourceId, isGlobalEditMode, transitionMode, transitionOrigin }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [draggingPinId, setDraggingPinId] = useState(null); // Track which pin is being dragged
    const containerRef = useRef(null);
    const clickStart = useRef({ x: 0, y: 0 });
    const pinWasDragged = useRef(false);


    // ...

    const handleImageLoad = (e) => {
        if (!containerRef.current) return;

        const img = e.target;
        const container = containerRef.current;

        const contentWidth = img.naturalWidth;
        const contentHeight = img.naturalHeight;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit with margin
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        const scaleToFit = Math.min(scaleX, scaleY) * 0.9; // 90% fit

        // Limit max initial zoom to 1
        const newScale = Math.min(scaleToFit, 1);

        // Center logic
        const newX = (containerWidth - contentWidth * newScale) / 2;
        const newY = (containerHeight - contentHeight * newScale) / 2;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    const handleWheel = (e) => {
        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Current world position under mouse
        const worldX = (mouseX - position.x) / scale;
        const worldY = (mouseY - position.y) / scale;

        // Exponential zoom for smoother control
        const scaleFactor = Math.exp(-e.deltaY * 0.001);

        let newScale = scale * scaleFactor;
        newScale = Math.min(Math.max(0.1, newScale), 10); // Limit zoom 0.1x to 10x

        // Calculate new position to keep world point under mouse
        const newX = mouseX - worldX * newScale;
        const newY = mouseY - worldY * newScale;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    const handleMouseDown = (e) => {
        // Only allow left click drag (button 0)
        if (e.button !== 0) return;

        // Don't start drag if clicking a pin
        if (e.target.closest('.map-pin')) return;

        // Track click start position
        clickStart.current = { x: e.clientX, y: e.clientY };

        e.preventDefault(); // Prevent native drag/select

        setIsDragging(true);
        // Store the offset of the mouse from the current position
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handlePinMouseDown = (e, pinId) => {
        // Only allow dragging in edit mode and if pin is already selected
        if (!isGlobalEditMode) return;
        if (selectedPinId !== pinId) return;
        e.stopPropagation();
        e.preventDefault();
        pinWasDragged.current = false; // Reset on each mousedown
        setDraggingPinId(pinId);
    };

    const handleMouseMove = (e) => {
        e.preventDefault();

        if (draggingPinId && mapImage) {
            // Pin Dragging Logic
            const rect = containerRef.current.getBoundingClientRect();
            // Calculate mouse position relative to map-world container (not screen)
            // But map-world is transformed. Easiest is to calculate relative to Image Rect.

            // Mouse -> Relative to Container -> Remove Pan -> Remove Scale = Local Image Coord

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const mapX = (mouseX - position.x) / scale;
            const mapY = (mouseY - position.y) / scale;

            // mapX/mapY are now pixels relative to image top-left (unscaled)

            // Need image dimensions to convert to %.
            const imgElement = containerRef.current.querySelector('.map-img-element');
            if (imgElement) {
                const percentX = (mapX / imgElement.naturalWidth) * 100;
                const percentY = (mapY / imgElement.naturalHeight) * 100;

                // Clamp
                const clampedX = Math.max(0, Math.min(100, percentX));
                const clampedY = Math.max(0, Math.min(100, percentY));

                onPinMove(draggingPinId, clampedX, clampedY);
                pinWasDragged.current = true; // Mark as dragged only when mouse actually moves
            }
            return;
        }

        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggingPinId(null);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        if (!isGlobalEditMode) return;
        if (isDragging) return;
        if (!mapImage) return;

        // Calculate relative coordinates (percentage of image size)
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (onContextMenu) {
            onContextMenu({ x, y }, { x: e.clientX, y: e.clientY });
        }
    };

    // ...

    const handleMapClick = (e) => {
        // Calculate distance moved during click
        const dist = Math.hypot(e.clientX - clickStart.current.x, e.clientY - clickStart.current.y);
        // If moved less than 5px, consider it a click (not a drag)
        if (dist < 5) {
            onSelectPin(null);
        }
    };

    // ...

    return (
        <div
            className="map-canvas-container"
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleMapClick}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div
                className={`transition-layer ${transitionMode || ''}`}
                style={{
                    transformOrigin: transitionOrigin ? `${transitionOrigin.x}% ${transitionOrigin.y}%` : 'center center',
                    '--tx': transitionOrigin ? `${transitionOrigin.x - 50}%` : '0',
                    '--ty': transitionOrigin ? `${transitionOrigin.y - 50}%` : '0',
                }}
            >
                <div
                    className="map-world"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    }}
                >
                    {mapImage && (
                        <div style={{ position: 'relative' }}>
                            <img
                                src={mapImage}
                                alt="Map"
                                className="map-img-element"
                                onLoad={handleImageLoad}
                                onContextMenu={handleContextMenu}
                                onDragStart={(e) => e.preventDefault()}
                                style={{
                                    display: 'block',
                                    pointerEvents: 'auto',
                                    cursor: connectingSourceId ? 'crosshair' : 'default'
                                }}
                            />

                            {/* Connections Layer */}
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
                                {pins.map(pin => (
                                    (pin.connections || []).map(targetId => {
                                        const target = pins.find(p => p.id === targetId);
                                        if (!target) return null;
                                        return (
                                            <line
                                                key={`${pin.id}-${target.id}`}
                                                x1={`${pin.x}%`}
                                                y1={`${pin.y}%`}
                                                x2={`${target.x}%`}
                                                y2={`${target.y}%`}
                                                stroke="rgba(255, 255, 255, 0.4)"
                                                strokeWidth="2"
                                                strokeDasharray="5,5"
                                            />
                                        );
                                    })
                                ))}
                            </svg>

                            {pins.map(pin => (
                                <Pin
                                    key={pin.id}
                                    x={pin.x}
                                    y={pin.y}
                                    data={pin}
                                    scale={scale}
                                    isEditing={isEditing && selectedPinId === pin.id} // Only editable if selected
                                    isSelected={selectedPinId === pin.id}
                                    disabled={!!transitionMode}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        // Suppress click if pin was just dragged
                                        if (pinWasDragged.current) {
                                            pinWasDragged.current = false;
                                            return;
                                        }

                                        // Calculate origin relative to container
                                        if (containerRef.current) {
                                            const rect = containerRef.current.getBoundingClientRect();
                                            const origin = {
                                                x: ((e.clientX - rect.left) / rect.width) * 100,
                                                y: ((e.clientY - rect.top) / rect.height) * 100
                                            };
                                            onSelectPin(pin.id, origin);
                                        } else {
                                            onSelectPin(pin.id);
                                        }
                                    }}
                                    onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
                                    onContextMenu={(e) => onPinContextMenu && onPinContextMenu(e, pin.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {!mapImage && (
                <div
                    className="details-placeholder"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        color: 'var(--text-color)',
                        opacity: 0.7
                    }}
                >
                    <h2>No Map Loaded</h2>
                    <p>Drag and drop an image file here to start.</p>
                </div>
            )}
        </div>
    );
};

export default MapCanvas;
