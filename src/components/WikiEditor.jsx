import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { X, Save, Upload, Edit2, Trash2 } from 'lucide-react';
import { ICONS, COLORS } from '../utils/constants';
import { sfx } from '../utils/SoundManager';

const WikiEditor = ({ selectedPin, onClose, onSave, onEnterMap, isEditing, onSetEditing, onDelete, items, onRemoveConnection, isGlobalEditMode, isVisible = true, onExited }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mapImage, setMapImage] = useState(null);
    const [icon, setIcon] = useState('default');
    const [color, setColor] = useState('#ef4444');
    const [showLabel, setShowLabel] = useState(false);


    useEffect(() => {
        if (selectedPin) {
            setTitle(selectedPin.title || '');
            setContent(selectedPin.content || '');
            setMapImage(selectedPin.mapImage || null);
            setIcon(selectedPin.icon || 'default');
            setColor(selectedPin.color || '#ef4444');
            setShowLabel(selectedPin.showLabel || false);
        }
    }, [selectedPin]);

    // ... (rest of component logic)

    const handleSave = () => {
        onSave(selectedPin.id, { title, content, mapImage, icon, color, showLabel });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setMapImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!selectedPin) return null;

    return (
        <div
            className="wiki-sidebar glass-panel"
            style={{
                width: '400px',
                right: 0,
                position: 'absolute',
                height: '100%',
                borderLeft: '1px solid var(--border-color)',
                borderRight: 'none',
                display: 'flex',
                flexDirection: 'column',
                transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 40 // Ensure above map but below floating toggle (30) - wait toggle is 30. Sidebar is ?
            }}
            onTransitionEnd={() => {
                if (!isVisible && onExited) {
                    onExited();
                }
            }}
        >
            <div className="sidebar-header">
                <h2 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: color }}>{title || 'Untitled'}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isGlobalEditMode && (
                        <button
                            className="icon-btn"
                            onClick={() => { sfx.playClick(); onDelete(); }}
                            onMouseEnter={() => sfx.playHover()}
                            title="Delete Location"
                            style={{ color: '#ef4444' }}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    {!isEditing && isGlobalEditMode && (
                        <button
                            className="icon-btn"
                            onClick={() => { sfx.playUiSelect(); onSetEditing(true); }}
                            onMouseEnter={() => sfx.playHover()}
                            title="Edit Location"
                            style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '4px', padding: '4px' }}
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                    <button
                        className="icon-btn"
                        onClick={() => { sfx.playUiSelect(); onClose(); }}
                        onMouseEnter={() => sfx.playHover()}
                        title="Close"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <div className="form-group">
                    {isEditing && (
                        <>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Location Name"
                            />
                        </>
                    )}
                </div>

                {isEditing && (
                    <>
                        <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                                <input
                                    type="checkbox"
                                    checked={showLabel}
                                    onChange={(e) => setShowLabel(e.target.checked)}
                                />
                                <span style={{ fontSize: '0.9rem' }}>Show Label on Map</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Color</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: c,
                                            border: color === c ? '2px solid var(--text-color)' : '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            boxShadow: color === c ? '0 0 0 2px var(--bg-color), 0 0 0 4px var(--primary-color)' : 'none',
                                            transform: color === c ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Icon</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                {ICONS.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setIcon(item.id)}
                                        title={item.label}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0.5rem',
                                            border: icon === item.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                            borderRadius: '0.5rem',
                                            backgroundColor: icon === item.id ? 'var(--secondary-color)' : 'transparent',
                                            cursor: 'pointer',
                                            color: icon === item.id ? 'var(--accent-color)' : 'var(--text-color)'
                                        }}
                                    >
                                        <item.icon size={20} color={icon === item.id ? color : 'currentColor'} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                    <ReactQuill
                        theme={isEditing ? "snow" : "bubble"}
                        value={content}
                        onChange={setContent}
                        readOnly={!isEditing}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: isEditing ? 'rgba(0,0,0,0.2)' : 'transparent', border: isEditing ? '1px solid var(--border-color)' : 'none', borderRadius: '0.5rem' }}
                        modules={{
                            toolbar: isEditing ? [
                                [{ 'header': [1, 2, false] }],
                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                                ['link', 'image'],
                                ['clean']
                            ] : false, // Hide toolbar in view mode
                        }}
                    />
                </div>

                {(selectedPin.connections?.length > 0 || (items && items.some(i => (i.connections || []).includes(selectedPin.id)))) && (
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Connected Locations</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Outgoing Connections */}
                            {(selectedPin.connections || []).map(connId => {
                                const connItem = items.find(i => i.id === connId);
                                if (!connItem) return null;
                                return (
                                    <div key={connId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connItem.color || 'var(--text-color)' }}></span>
                                            <span>{connItem.title || 'Untitled'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {isEditing && (
                                                <button
                                                    onClick={() => onRemoveConnection(connId)}
                                                    className="icon-btn"
                                                    title="Remove Connection"
                                                    style={{ color: '#ef4444', padding: '2px' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Incoming Connections */}
                            {items && items.filter(i => (i.connections || []).includes(selectedPin.id)).map(connItem => (
                                <div key={connItem.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '0.25rem', border: '1px dashed var(--border-color)', opacity: 0.8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', marginRight: '0.25rem' }}>↳ from</span>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connItem.color || 'var(--text-color)' }}></span>
                                        <span>{connItem.title || 'Untitled'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Location Map</label>

                    {mapImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', width: '100%', height: '150px', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                <img src={mapImage} alt="Location map preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {isEditing && (
                                    <button
                                        onClick={() => setMapImage(null)}
                                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                                        title="Remove Image"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                className="btn-primary"
                                onClick={() => onEnterMap(selectedPin.id)}
                                style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Enter {title || 'Location'}
                            </button>
                        </div>
                    ) : (
                        isEditing && (
                            <div
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '0.5rem',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    transition: 'background-color 0.2s',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(0,0,0,0.05)'
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type.startsWith('image/')) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            setMapImage(event.target.result);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                onClick={() => document.getElementById('sub-loc-upload').click()}
                            >
                                <Upload size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>Drag & Drop Image Here</p>
                                <p style={{ margin: '0', fontSize: '0.8rem', opacity: 0.7 }}>or click to browse</p>
                                <input
                                    id="sub-loc-upload"
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        )
                    )}
                </div>
            </div>

            {
                isEditing && (
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button className="btn-primary" onClick={handleSave} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                )
            }
        </div >
    );
};

export default WikiEditor;
