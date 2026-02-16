import React from 'react';

const ContextMenu = ({ x, y, visible, mode = 'map', onAddLocation, onEditPin, onDeletePin, onConnect, onClose }) => {
    if (!visible) return null;

    return (
        <div
            className="glass-panel"
            style={{
                position: 'absolute',
                top: y,
                left: x,
                zIndex: 1000,
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                minWidth: '150px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {mode === 'map' && (
                <button
                    className="btn-menu-item"
                    onClick={() => { onAddLocation(); onClose(); }}
                    style={menuItemStyle}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    Add Location
                </button>
            )}

            {mode === 'pin' && (
                <>
                    <button
                        className="btn-menu-item"
                        onClick={() => { onEditPin(); onClose(); }}
                        style={menuItemStyle}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        Edit Location
                    </button>
                    <button
                        className="btn-menu-item"
                        onClick={() => { onConnect(); onClose(); }}
                        style={menuItemStyle}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        Connect to...
                    </button>
                    <button
                        className="btn-menu-item"
                        onClick={() => { onDeletePin(); onClose(); }}
                        style={{ ...menuItemStyle, color: '#ef4444' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Delete Location
                    </button>
                </>
            )}
        </div>
    );
};

const menuItemStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-color)',
    textAlign: 'left',
    padding: '0.5rem',
    cursor: 'pointer',
    borderRadius: '0.25rem',
    fontSize: '0.9rem',
    fontWeight: '500'
};

const handleMouseEnter = (e) => e.target.style.backgroundColor = 'var(--primary-color)';
const handleMouseLeave = (e) => e.target.style.backgroundColor = 'transparent';

export default ContextMenu;
