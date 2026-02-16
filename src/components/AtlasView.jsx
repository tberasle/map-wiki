import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Map, MapPin } from 'lucide-react';
import { sfx } from '../utils/SoundManager';
import { ICONS } from '../utils/constants';

const AtlasView = ({ items, currentViewId, onNavigate, onSelect, onClose }) => {
    const [expandedIds, setExpandedIds] = useState(new Set(['root']));

    // Build tree structure
    const tree = useMemo(() => {
        const buildTree = (parentId) => {
            return items
                .filter(item => item.parentId === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(item.id)
                }));
        };
        return buildTree('root'); // Start searching for top-level items (parentId === 'root' for actual items, or items with no items)
        // Wait, items with parentId === 'root' are top level.
        // But what if the 'root' map itself isn't an item? It's just the container.
        // So we just want items where parentId === currentViewId? No, we want ALL items.
        // The root is implicitly the container.
    }, [items]);

    const toggleExpand = (id, e) => {
        e.stopPropagation();
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const renderNode = (node, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const Icon = (ICONS.find(i => i.id === node.icon) || ICONS[0]).icon;
        const isCurrent = node.id === currentViewId;

        return (
            <div key={node.id} style={{ marginLeft: `${depth * 1}rem` }}>
                <div
                    className={`atlas-node ${isCurrent ? 'active' : ''}`}
                    onClick={() => {
                        if (node.mapImage) {
                            sfx.playEnterMap();
                            onNavigate(node.id);
                            onSelect(null); // Deselect when entering a map
                        } else {
                            sfx.playUiSelect();
                            onNavigate(node.parentId);
                            onSelect(node.id);
                        }
                        onClose();
                    }}
                    style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '0.25rem',
                        color: 'var(--text-color)',
                        backgroundColor: isCurrent ? 'var(--primary-color)' : 'transparent',
                        opacity: isCurrent ? 1 : 0.8
                    }}
                    onMouseEnter={(e) => !isCurrent && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={(e) => !isCurrent && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <div
                        onClick={(e) => hasChildren && toggleExpand(node.id, e)}
                        style={{ width: '20px', display: 'flex', alignItems: 'center', cursor: hasChildren ? 'pointer' : 'default' }}
                    >
                        {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                    </div>

                    <Icon size={16} style={{ marginRight: '0.5rem', color: node.color || 'var(--text-color)' }} />

                    <span style={{ fontWeight: hasChildren ? '600' : '400' }}>{node.title || 'Untitled'}</span>

                    {node.mapImage && <Map size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                </div>

                {hasChildren && isExpanded && (
                    <div className="atlas-children">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="glass-panel" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '600px',
            maxHeight: '80vh',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Map size={24} /> Atlas
                </h2>
                <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
                {/* Root Level */}
                <div
                    className="atlas-node"
                    onClick={() => { onNavigate('root'); onClose(); }}
                    style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '0.25rem',
                        marginBottom: '0.5rem',
                        fontWeight: 'bold',
                        backgroundColor: currentViewId === 'root' ? 'var(--primary-color)' : 'transparent'
                    }}
                >
                    <div style={{ width: '20px' }}></div>
                    <MapPin size={16} style={{ marginRight: '0.5rem' }} />
                    Home (Root)
                </div>

                {tree.map(node => renderNode(node))}

                {tree.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>
                        No locations added yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AtlasView;
