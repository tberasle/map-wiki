import React from 'react';
import { Map as MapIcon, MapPin } from 'lucide-react'; // MapIcon is used for sub-map badge, MapPin as fallback
import { ICONS } from '../utils/constants';
import { sfx } from '../utils/SoundManager';

const Pin = ({ x, y, data, isSelected, onClick, color, scale = 1, isEditing, onMouseDown, onContextMenu, disabled }) => {
    if (!data) return null;

    // Safety check for ICONS
    const safeIcons = ICONS || [{ id: 'default', icon: MapPin }];
    const iconDef = safeIcons.find(i => i.id === data.icon) || safeIcons[0];
    const IconComponent = iconDef ? iconDef.icon : MapPin;

    const hasSubMap = data.mapImage;
    const pinScale = Math.max(0.1, 1 / scale); // Prevent divide by zero / extreme shrinking

    // Determine anchor point based on icon type
    const CENTER_ANCHOR_ICONS = ['star', 'planet', 'spaceship', 'danger', 'energy', 'shield', 'fuel'];
    const isCenterAnchored = CENTER_ANCHOR_ICONS.includes(data.icon);

    // If center anchored, we want the center of the icon to be at (x,y).
    // If bottom anchored, we want the bottom-center of the icon to be at (x,y).
    // The Label is now absolute, so it doesn't affect the size of the container.

    const transformStyle = isCenterAnchored
        ? `translate(-50%, -50%) scale(${pinScale})`
        : `translate(-50%, -100%) scale(${pinScale})`;

    const transformOriginStyle = isCenterAnchored ? '50% 50%' : '50% 100%';

    return (
        <div
            className={`map-pin ${isSelected ? 'selected' : ''} ${data.showLabel ? 'force-visible' : ''}`}
            style={{
                left: `${x}%`,
                top: `${y}%`,
                // display: 'flex' removed to let container shrink to icon size
                position: 'absolute', // Ensure it's absolute
                transform: transformStyle,
                transformOrigin: transformOriginStyle,
                zIndex: isSelected ? 100 : 1,
                cursor: isEditing ? 'move' : (disabled ? 'default' : 'pointer'),
                pointerEvents: disabled ? 'none' : 'auto',
                opacity: disabled ? 0.7 : 1
            }}
            onClick={(e) => {
                if (disabled) return;
                e.stopPropagation();
                try {
                    sfx.playUiSelect();
                } catch (err) {
                    console.warn("SFX Error:", err);
                }
                if (onClick) onClick(e);
            }}
            onMouseEnter={() => {
                if (disabled) return;
                try {
                    sfx.playHover();
                } catch (e) { /* ignore */ }
            }}
            onMouseDown={onMouseDown}
            onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onContextMenu) onContextMenu(e);
            }}
            title={data.title || 'Untitled'}
        >
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <IconComponent
                    size={32}
                    color={color || (data.color || '#ef4444')}
                    fill={isSelected ? (color || data.color || '#ef4444') : 'none'}
                />
                {hasSubMap && (
                    <div style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Removed bg
                        // borderRadius: '50%',
                        padding: '1px',
                        // border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.8))'
                    }}>
                        <MapIcon size={12} color="#fbbf24" strokeWidth={3} />
                    </div>
                )}
            </div>

            <div
                className="pin-label"
                style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '4px'
                }}
            >
                {data.title || 'Untitled'}
            </div>
        </div>
    );
};

export default Pin;
