
import React, { useState } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Map as MapIcon, ChevronRight, Volume2, VolumeX, Search, Filter, Image, Edit2, Eye } from 'lucide-react';
import { sfx } from '../utils/SoundManager';
import { ICONS } from '../utils/constants';

const Sidebar = ({
    pins,
    onSelectPin,
    onDeletePin,
    onExport,
    onImport,
    onToggleTheme,
    isDarkMode,
    breadcrumbs,
    onNavigate,
    onBack,
    activeFilters = [],
    onToggleFilter,

    onOpenAtlas,
    onExportImage,
    isGlobalEditMode,
    onToggleGlobalEdit,
    starSettings,
    onUpdateStarSettings
}) => {
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showSettings, setShowSettings] = useState(false); // New state for settings panel

    const toggleMute = () => {
        const muted = sfx.toggleMute();
        setIsMuted(muted);
    };

    const filteredPins = pins.filter(pin =>
        (pin.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="wiki-sidebar glass-panel" style={{ width: '300px' }}>
            <div className="sidebar-header" style={{ gap: '0.5rem' }}>
                <button
                    className="icon-btn"
                    onClick={onBack}
                    onMouseEnter={() => sfx.playHover()}
                    title="Back to Dashboard"
                    style={{ marginRight: '0.5rem' }}
                >
                    <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                    <MapIcon size={20} />
                    Wiki Map
                </h2>
                <div style={{ flex: 1 }} />
                <div
                    className="toggle-switch"
                    onClick={() => { sfx.playUiSelect(); onToggleGlobalEdit(); }}
                    onMouseEnter={() => sfx.playHover()}
                    title={isGlobalEditMode ? "Switch to View Mode" : "Switch to Edit Mode"}
                >
                    <div className={`toggle-option ${!isGlobalEditMode ? 'active' : ''}`}>View</div>
                    <div className={`toggle-option ${isGlobalEditMode ? 'active' : ''}`}>Edit</div>
                    <div className={`toggle-slider ${isGlobalEditMode ? 'right' : 'left'}`} />
                </div>

                <button
                    className="icon-btn"
                    onClick={toggleMute}
                    onMouseEnter={() => sfx.playHover()}
                    title={isMuted ? "Unmute SFX" : "Mute SFX"}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button
                    className="icon-btn"
                    onClick={onToggleTheme}
                    onMouseEnter={() => sfx.playHover()}
                    title="Toggle Theme"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Breadcrumbs */}
            <div className="breadcrumbs" style={{
                padding: '0.5rem',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                alignItems: 'center'
            }}>
                {breadcrumbs && breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        {index > 0 && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                        <span
                            style={{
                                cursor: 'pointer',
                                color: index === breadcrumbs.length - 1 ? 'var(--primary-color)' : 'var(--text-color)',
                                fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal',
                                opacity: index === breadcrumbs.length - 1 ? 1 : 0.8
                            }}
                            onClick={() => onNavigate(crumb.id)}
                            onMouseEnter={() => sfx.playHover()}
                        >
                            {crumb.title || 'Untitled'}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Search and Filters */}
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: showFilters ? '0.5rem' : 0 }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <Search size={16} style={{ opacity: 0.5, marginRight: '0.5rem' }} />
                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-color)',
                                outline: 'none',
                                width: '100%'
                            }}
                        />
                    </div>
                    <button
                        className="icon-btn"
                        onClick={() => { sfx.playUiSelect(); setShowFilters(!showFilters); }}
                        onMouseEnter={() => sfx.playHover()}
                        style={{
                            backgroundColor: showFilters || activeFilters.length > 0 ? 'var(--secondary-color)' : 'transparent',
                            border: showFilters || activeFilters.length > 0 ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                            color: showFilters || activeFilters.length > 0 ? 'var(--accent-color)' : 'var(--text-color)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            height: 'auto'
                        }}
                        title="Toggle Filters"
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {showFilters && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '0.25rem',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        {ICONS.map(item => {
                            const isActive = activeFilters.includes(item.id);
                            const isOthersActive = activeFilters.length > 0;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { sfx.playUiSelect(); onToggleFilter(item.id); }}
                                    onMouseEnter={() => sfx.playHover()}
                                    title={item.label}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.25rem',
                                        border: isActive ? 'none' : '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                                        color: isActive ? 'white' : 'var(--text-color)',
                                        cursor: 'pointer',
                                        opacity: isActive || !isOthersActive ? 1 : 0.4
                                    }}
                                >
                                    <item.icon size={16} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="sidebar-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: '0 1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={onOpenAtlas}
                    title="Open Atlas View"
                    onMouseEnter={() => sfx.playHover()}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
                >
                    <MapIcon size={16} /> Open Atlas
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-small" onClick={onExport} title="Export JSON" onMouseEnter={() => sfx.playHover()}>
                        <Download size={16} /> Export
                    </button>
                    <label className="btn-small" title="Import JSON" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={() => sfx.playHover()}>
                        <Upload size={16} /> Import
                        <input type="file" onChange={onImport} accept=".json" style={{ display: 'none' }} />
                    </label>
                </div>
                <button
                    className="btn-secondary"
                    onClick={onExportImage}
                    title="Export Map as PNG"
                    onMouseEnter={() => sfx.playHover()}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
                >
                    <Image size={16} /> Export Image
                </button>
            </div>

            <div className="sidebar-content">
                <h3 style={{ padding: '0 1rem' }}>Items ({filteredPins.length})</h3>
                {filteredPins.length === 0 && <p style={{ opacity: 0.6, fontStyle: 'italic', padding: '0 1rem' }}>No items found.</p>}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {filteredPins.map(pin => (
                        <li
                            key={pin.id}
                            className="pin-list-item"
                            style={{
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                backgroundColor: 'var(--secondary-color)',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid var(--border-color)',
                                borderLeft: pin.mapImage ? '4px solid var(--accent-color)' : '1px solid var(--border-color)'
                            }}
                            onClick={() => { sfx.playUiSelect(); onSelectPin(pin.id); }}
                            onMouseEnter={() => sfx.playHover()}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {pin.mapImage ? <MapIcon size={16} color="var(--accent-color)" /> : <div style={{ width: 16 }} />}
                                <span style={{ fontWeight: '500' }}>{pin.title || 'Untitled'}</span>
                            </div>
                            {isGlobalEditMode && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); sfx.playClick(); onDeletePin(pin.id); }}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                    title="Delete Location"
                                    onMouseEnter={() => sfx.playHover()}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {/* Visual Effects Settings */}
            <div className="section-header" onClick={() => setShowSettings(!showSettings)} style={{ cursor: 'pointer', marginTop: '1rem' }}>
                <h3>Visual Effects</h3>
                {showSettings ? <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={16} />}
            </div>

            {showSettings && starSettings && onUpdateStarSettings && (
                <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label>Star Color</label>
                        <input
                            type="color"
                            value={starSettings.starColor}
                            onChange={(e) => onUpdateStarSettings({ ...starSettings, starColor: e.target.value })}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '30px', height: '30px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label>Nebula Color</label>
                        <input
                            type="color"
                            value={starSettings.nebulaColor || '#4c1d95'}
                            onChange={(e) => onUpdateStarSettings({ ...starSettings, nebulaColor: e.target.value })}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '30px', height: '30px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label>Nebula Intensity: {Math.round((starSettings.nebulaIntensity || 0) * 100)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={starSettings.nebulaIntensity || 0}
                            onChange={(e) => onUpdateStarSettings({ ...starSettings, nebulaIntensity: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label>Star Twinkle: {starSettings.twinkleSpeed || 0}x</label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={starSettings.twinkleSpeed !== undefined ? starSettings.twinkleSpeed : 0.5}
                            onChange={(e) => onUpdateStarSettings({ ...starSettings, speed: 0, twinkleSpeed: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
export default Sidebar;
