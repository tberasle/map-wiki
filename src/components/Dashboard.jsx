import React, { useState, useRef, useEffect } from 'react';
import { Plus, FolderOpen, Trash2, Upload, Map as MapIcon, Clock, Pencil } from 'lucide-react';

const Dashboard = ({ projects, onCreateProject, onOpenProject, onDeleteProject, onImportProject, onRenameProject }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const editInputRef = useRef(null);

    useEffect(() => {
        if (editingProjectId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingProjectId]);

    const handleRename = (id) => {
        const trimmed = editingName.trim();
        if (trimmed && onRenameProject) {
            onRenameProject(id, trimmed);
        }
        setEditingProjectId(null);
        setEditingName('');
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="dashboard-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)',
            padding: '2rem',
            overflow: 'hidden'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '800px',
                height: '80%',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '2rem' }}>
                        <MapIcon size={40} color="var(--primary-color)" />
                        Map Projects
                    </h1>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                            <Upload size={20} />
                            Import
                            <input type="file" onChange={onImportProject} accept=".json" style={{ display: 'none' }} />
                        </label>
                        <button
                            className="btn-primary"
                            onClick={() => setIsCreating(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                        >
                            <Plus size={20} />
                            New Project
                        </button>
                    </div>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project Name"
                                autoFocus
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-primary">Create</button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={() => setIsCreating(false)}
                                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="project-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {projects.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '4rem' }}>
                            <FolderOpen size={64} style={{ marginBottom: '1rem' }} />
                            <h3>No Projects Found</h3>
                            <p>Create a new project or import one to get started.</p>
                        </div>
                    ) : (
                        projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onOpenProject(project.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--secondary-color)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {editingProjectId === project.id ? (
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(project.id);
                                                if (e.key === 'Escape') { setEditingProjectId(null); setEditingName(''); }
                                            }}
                                            onBlur={() => handleRename(project.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                fontSize: '1.2rem',
                                                fontWeight: 600,
                                                width: '100%',
                                                padding: '0.25rem 0.5rem',
                                                margin: '0 0 0.5rem 0',
                                                backgroundColor: 'var(--bg-color)',
                                                border: '1px solid var(--primary-color)',
                                                borderRadius: '0.375rem',
                                                color: 'var(--text-color)',
                                                outline: 'none'
                                            }}
                                        />
                                    ) : (
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{project.name}</h3>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
                                        <Clock size={14} />
                                        Last modified: {formatDate(project.lastModified)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProjectId(project.id);
                                            setEditingName(project.name);
                                        }}
                                        className="icon-btn"
                                        title="Rename Project"
                                        style={{ color: 'var(--text-color)', padding: '0.75rem', opacity: 0.6, transition: 'opacity 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteProject(project.id);
                                        }}
                                        className="icon-btn"
                                        title="Delete Project"
                                        style={{ color: '#ef4444', padding: '0.75rem' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
