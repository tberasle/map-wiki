import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import WikiEditor from './components/WikiEditor';
import ContextMenu from './components/ContextMenu';
import Dashboard from './components/Dashboard';
import AtlasView from './components/AtlasView';
import VisualEffects from './components/VisualEffects';
import { sfx } from './utils/SoundManager';
import StorageManager from './utils/StorageManager';
import ProjectLoader from './utils/ProjectLoader';
import html2canvas from 'html2canvas';
import './index.css';

// ...

function App() {
  // ...


  // ...

  // App View State
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'editor'
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [showAtlas, setShowAtlas] = useState(false);


  // Editor State
  const [items, setItems] = useState([]); // Flat list of all items
  const [currentViewId, setCurrentViewId] = useState('root');
  const [rootMapImage, setRootMapImage] = useState(null);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeEditorItem, setActiveEditorItem] = useState(null); // For animation
  const [isWikiVisible, setIsWikiVisible] = useState(false);
  const [transitionMode, setTransitionMode] = useState(null); // 'zooming-in' | 'zooming-out' | null
  const [transitionOrigin, setTransitionOrigin] = useState(null); // { x, y } in percentages

  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('map-wiki-theme');
    return saved ? saved === 'dark' : true;
  });

  const DEFAULT_STAR_SETTINGS = {
    starColor: '#ffffff',
    bgColor: 'transparent',
    speed: 0,
    twinkleSpeed: 0.5,
    nebulaColor: '#4c1d95',
    nebulaIntensity: 0.3 // Updated default to 30%
  };

  const [rootStarSettings, setRootStarSettings] = useState(DEFAULT_STAR_SETTINGS);


  // Context Menu State

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, mapX: 0, mapY: 0 });
  const [connectingSourceId, setConnectingSourceId] = useState(null);

  // Initial Load & Migration Logic
  useEffect(() => {
    // 1. Load Project Index
    const indexData = localStorage.getItem('map-wiki-index');
    let loadedProjects = indexData ? JSON.parse(indexData) : [];

    // 2. Check for Legacy Data (Backwards Compatibility)
    const legacyData = localStorage.getItem('dnd-map-wiki-data');
    if (legacyData) {
      // Check if we already migrated it (avoid duplicate "Legacy Project"s if user clears index but not legacy data?)
      // We can't really know, but we can check if there's a project named "Legacy Project"
      const alreadyMigrated = loadedProjects.find(p => p.name === 'Legacy Project');

      if (!alreadyMigrated) {
        const legacyProject = {
          id: 'legacy-' + Date.now(),
          name: 'Legacy Project',
          lastModified: Date.now()
        };

        // Save the legacy data content to the new project key
        localStorage.setItem(`map-wiki-project-${legacyProject.id}`, legacyData);

        // Update Index
        loadedProjects = [legacyProject, ...loadedProjects];
        localStorage.setItem('map-wiki-index', JSON.stringify(loadedProjects));

        // Remove legacy key to prevent regeneration
        localStorage.removeItem('dnd-map-wiki-data');
      }
    }

    setProjects(loadedProjects);
  }, []);

  // Auto-Save Current Project
  // Auto-Save Current Project (Debounced)
  useEffect(() => {
    if (currentProjectId && viewMode === 'editor') {
      const dataToSave = {
        id: currentProjectId, // Required for keyPath
        name: (projects.find(p => p.id === currentProjectId) || {}).name, // Store name in object too? Optional but good for backup
        items,
        rootMapImage,
        isDarkMode,
        rootStarSettings
      };

      const save = async () => {
        try {
          await StorageManager.saveProject(dataToSave);

          // Update Last Modified in Index (localStorage)
          const updatedProjects = projects.map(p =>
            p.id === currentProjectId ? { ...p, lastModified: Date.now() } : p
          );
          // Only update LS index if needed, don't trigger state update loop
          localStorage.setItem('map-wiki-index', JSON.stringify(updatedProjects));
        } catch (err) {
          if (err.name === 'QuotaExceededError') {
            alert("Storage Quota Exceeded! Please delete some projects or reduce image sizes.");
          } else {
            console.error("Auto-save failed:", err);
          }
        }
      };

      // Debounce save (1s)
      const timeoutId = setTimeout(save, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [items, rootMapImage, isDarkMode, rootStarSettings, currentProjectId, viewMode]);

  // Auto-Load Sample Projects
  useEffect(() => {
    const loadSamples = async () => {
      try {
        // Glob import all JSONs from Sample Projects folder
        // Using relative path from src/App.jsx to root/Sample Projects
        const modules = import.meta.glob('../Sample Projects/*.json');

        const newSamples = await ProjectLoader.loadSampleProjects(modules);

        if (newSamples.length > 0) {
          setProjects(prev => {
            // Filter duplicates just in case
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = newSamples.filter(s => !existingIds.has(s.id));

            if (uniqueNew.length === 0) return prev;

            const nextState = [...uniqueNew, ...prev];
            localStorage.setItem('map-wiki-index', JSON.stringify(nextState));
            return nextState;
          });
        }

      } catch (err) {
        console.error("Failed to load sample projects glob:", err);
      }
    };

    // Small delay to ensure DB is ready? Not strictly needed but safe.
    // Actually, requestIdleCallback would be nice, but setTimeout(..., 1000) is fine to avoid boot lag.
    setTimeout(loadSamples, 1000);
  }, []);

  // Persist Theme Preference
  useEffect(() => {
    localStorage.setItem('map-wiki-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Project Management Functions
  const handleCreateProject = async (name) => {
    const newProject = {
      id: Date.now().toString(),
      name: name,
      lastModified: Date.now()
    };

    // Initialize Empty Project Area
    const emptyData = {
      id: newProject.id, // IDB Key
      items: [],
      rootMapImage: null,
      isDarkMode: true,
      rootStarSettings: DEFAULT_STAR_SETTINGS
    };

    try {
      await StorageManager.saveProject(emptyData);

      // Update Index
      const newIndex = [newProject, ...projects];
      setProjects(newIndex);
      localStorage.setItem('map-wiki-index', JSON.stringify(newIndex));

      // Open It
      await handleLoadProject(newProject.id);
    } catch (err) {
      alert("Failed to create project: " + err.message);
    }
  };

  const handleLoadProject = async (id) => {
    try {
      let data = await StorageManager.loadProject(id);

      // Fallback: Try migration from LocalStorage if not found in IDB
      if (!data) {
        data = await StorageManager.migrateFromLocalStorage(id);
      }

      if (data) {
        // Load State
        setItems(data.items || []);
        setRootMapImage(data.rootMapImage || null);
        setIsDarkMode(data.isDarkMode !== undefined ? data.isDarkMode : true);
        setRootStarSettings(data.rootStarSettings || DEFAULT_STAR_SETTINGS);

        // Reset View State
        setCurrentViewId('root');
        setSelectedItemId(null);

        setCurrentProjectId(id);
        setViewMode('editor');
      } else {
        alert("Error: Project data not found!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load project from database.");
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      try {
        // Remove Data from IDB
        await StorageManager.deleteProject(id);
        // Also try removing from LS just in case
        localStorage.removeItem(`map-wiki-project-${id}`);

        // Update Index
        const newIndex = projects.filter(p => p.id !== id);
        setProjects(newIndex);
        localStorage.setItem('map-wiki-index', JSON.stringify(newIndex));
      } catch (err) {
        alert("Failed to delete project: " + err.message);
      }
    }
  };

  const handleRenameProject = (id, newName) => {
    const updatedProjects = projects.map(p =>
      p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p
    );
    setProjects(updatedProjects);
    localStorage.setItem('map-wiki-index', JSON.stringify(updatedProjects));
  };

  const handleImportProject = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          // Validate basic structure
          if (!Array.isArray(data.items)) throw new Error("Invalid format");

          const name = file.name.replace('.json', '');
          const newProject = {
            id: Date.now().toString(),
            name: name,
            lastModified: Date.now()
          };

          const projectData = {
            id: newProject.id,
            items: data.items,
            rootMapImage: data.rootMapImage,
            isDarkMode: data.isDarkMode ?? true,
            rootStarSettings: data.rootStarSettings || DEFAULT_STAR_SETTINGS
          };

          await StorageManager.saveProject(projectData);

          const newIndex = [newProject, ...projects];
          setProjects(newIndex);
          localStorage.setItem('map-wiki-index', JSON.stringify(newIndex));
        } catch (err) {
          alert("Failed to import project: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBackToDashboard = () => {
    // Auto-save triggers on state change, but let's be explicit
    // (Effect handles it)

    // Need to update the projects list state with the latest LastModified
    // because we silently updated localStorage in the effect.
    const indexData = localStorage.getItem('map-wiki-index');
    if (indexData) setProjects(JSON.parse(indexData));

    setViewMode('dashboard');
    setCurrentProjectId(null);
  };

  // Editor Handlers (Same as before)
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (getCurrentMapImage()) return; // Prevent replace if map exists

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (currentViewId === 'root') {
          setRootMapImage(event.target.result);
        } else {
          // Update the sub-map image for the CURRENT VIEW's item
          setItems(prev => prev.map(item =>
            item.id === currentViewId ? { ...item, mapImage: event.target.result } : item
          ));
        }
      };
      reader.readAsDataURL(file);
    }
  }, [currentViewId, items, rootMapImage]);


  // Manage WikiEditor visibility animation
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        setActiveEditorItem(item);
        // Small delay to ensure render happens before transition class is applied
        setTimeout(() => setIsWikiVisible(true), 10);
      }
    } else {
      setIsWikiVisible(false);
    }
  }, [selectedItemId, items]);

  // Keep editor content fresh while open
  useEffect(() => {
    if (isWikiVisible && selectedItemId && activeEditorItem && activeEditorItem.id === selectedItemId) {
      const currentItem = items.find(i => i.id === selectedItemId);
      if (currentItem && currentItem !== activeEditorItem) {
        setActiveEditorItem(currentItem);
      }
    }
  }, [items, isWikiVisible, selectedItemId, activeEditorItem]);

  const handleDeleteMap = () => {
    if (window.confirm('Are you sure you want to delete the current map image? Pins will remain.')) {
      if (currentViewId === 'root') {
        setRootMapImage(null);
      } else {
        setItems(prev => prev.map(item =>
          item.id === currentViewId ? { ...item, mapImage: null } : item
        ));
      }
    }
  };

  const handleRightClick = (coords, clientCoords) => {
    setContextMenu({
      visible: true,
      x: clientCoords.x,
      y: clientCoords.y,
      mapX: coords.x,
      mapY: coords.y,
      mode: 'map',
      targetId: null
    });
  };

  const handlePinRightClick = (e, pinId) => {
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      mapX: 0, // Not needed for pin actions
      mapY: 0,
      mode: 'pin',
      targetId: pinId
    });
  };

  const handleNavigate = (targetId, direction, origin = null) => {
    const previousViewId = currentViewId;

    // 1. Setup Phase A (Exit) - animates the CURRENT content in-place
    if (direction === 'in') {
      setTransitionOrigin(origin || { x: 50, y: 50 });
      setTransitionMode('zooming-in');
    } else {
      const childItem = items.find(i => i.id === previousViewId);
      if (childItem) {
        setTransitionOrigin({ x: childItem.x, y: childItem.y });
      } else {
        setTransitionOrigin({ x: 50, y: 50 });
      }
      setTransitionMode('zooming-out');
    }

    setSelectedItemId(null);
    // DON'T change currentViewId yet - let the exit animation play on actual content

    // 2. Wait for Phase A to complete, THEN switch content
    setTimeout(() => {
      // Switch view now (content is invisible at this point - opacity 0 from exit animation)
      setCurrentViewId(targetId);

      // 3. Setup Phase B (Enter) - animates the NEW content in
      if (direction === 'in') {
        setTransitionMode('entering-in');
      } else {
        setTransitionMode('entering-out');
      }

      // 4. Wait for Phase B to complete
      setTimeout(() => {
        setTransitionMode(null);
        setTransitionOrigin(null);
      }, 500);

    }, 500);
  };

  const handleAddLocation = () => {
    const newItem = {
      id: Date.now().toString(),
      parentId: currentViewId,
      type: 'location',
      x: contextMenu.mapX,
      y: contextMenu.mapY,
      title: 'New Location',
      content: '',
      mapImage: null,
      icon: 'default',
      showLabel: false
    };

    setItems(prev => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleDeleteLocation = (id) => {
    if (window.confirm('Delete this location and all its sub-content?')) {
      const idsToDelete = [id];
      const findChildren = (parentId) => {
        const children = items.filter(i => i.parentId === parentId);
        children.forEach(c => {
          idsToDelete.push(c.id);
          findChildren(c.id);
        });
      };
      findChildren(id);

      setItems(items.filter(i => !idsToDelete.includes(i.id)));
      if (selectedItemId === id) setSelectedItemId(null);
    }
  };

  // Delete key shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedItemId && !transitionMode) {
        // Don't delete if user is typing in an input or textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        handleDeleteLocation(selectedItemId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, transitionMode, items]);

  // Breadcrumb navigation logic
  const getBreadcrumbs = () => {
    const path = [];
    let current = currentViewId;
    while (current !== 'root') {
      const mapItem = items.find(i => i.id === current);
      if (mapItem) {
        path.unshift({ id: mapItem.id, title: mapItem.title });
        current = mapItem.parentId;
      } else {
        break; // Orphaned?
      }
    }
    path.unshift({ id: 'root', title: 'Main Map' });
    return path;
  };

  // Get current map image
  const getCurrentMapImage = () => {
    if (currentViewId === 'root') return rootMapImage;
    const mapItem = items.find(i => i.id === currentViewId);
    return mapItem ? mapItem.mapImage : null;
  };

  const [activeFilters, setActiveFilters] = useState([]);

  const handleToggleFilter = (id) => {
    setActiveFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExportImage = async () => {
    const element = document.querySelector('.map-canvas-container'); // Capture visible area
    if (!element) return;

    // Force labels to be visible
    element.classList.add('export-mode');

    // Wait for any transitions/renders
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(element, {
        useCORS: true, // Handle potential cross-origin images
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', // Match bg
        logging: false
      });

      const link = document.createElement('a');
      link.download = `map-export-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export image.");
    } finally {
      element.classList.remove('export-mode');
    }
  };

  // Visible items for current view
  const visibleItems = items.filter(i => {
    const isCorrectParent = i.parentId === currentViewId;
    const isVisible = activeFilters.length === 0 || activeFilters.includes(i.icon || 'default');
    return isCorrectParent && isVisible;
  });
  const selectedItem = items.find(i => i.id === selectedItemId);

  // Recursive Visual Settings Resolution
  const getEffectiveStarSettings = (viewId) => {
    // 1. Start at the current view
    let currentId = viewId;

    // 2. Traverse up until settings are found
    while (currentId !== 'root') {
      const item = items.find(i => i.id === currentId);
      if (item) {
        if (item.starSettings) {
          // Found explicit settings!
          // Merge with defaults to ensure all keys exist
          return { ...DEFAULT_STAR_SETTINGS, ...item.starSettings };
        }
        currentId = item.parentId; // Go up
      } else {
        break; // Orphaned?
      }
    }

    // 3. Fallback to Root
    return { ...DEFAULT_STAR_SETTINGS, ...rootStarSettings };
  };

  const currentStarSettings = getEffectiveStarSettings(currentViewId);

  const handleUpdateStarSettings = (newSettings) => {
    if (currentViewId === 'root') {
      setRootStarSettings(newSettings);
    } else {
      // Update the CURRENT ITEM (the map container we are inside)
      setItems(prev => prev.map(item =>
        item.id === currentViewId ? { ...item, starSettings: newSettings } : item
      ));
    }
  };

  const handleResetStarSettings = () => {
    if (window.confirm("Reset visual effects to default/inherited values?")) {
      if (currentViewId === 'root') {
        setRootStarSettings(DEFAULT_STAR_SETTINGS);
      } else {
        // Remove settings to trigger inheritance
        setItems(prev => prev.map(item => {
          if (item.id === currentViewId) {
            const { starSettings, ...rest } = item;
            return rest;
          }
          return item;
        }));
      }
    }
  };

  // RENDER
  if (viewMode === 'dashboard') {
    return (
      <Dashboard
        projects={projects}
        onCreateProject={handleCreateProject}
        onOpenProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onImportProject={handleImportProject}
        onRenameProject={handleRenameProject}
      />
    );
  }

  return (
    <div
      className={`app-container ${!isDarkMode ? 'light-mode' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => setContextMenu({ ...contextMenu, visible: false })} // Close menu on global click
      style={{ backgroundColor: isDarkMode ? 'var(--bg-color)' : 'var(--bg-color)', color: 'var(--text-color)' }}
    >
      <VisualEffects
        warpMode={transitionMode}
        origin={transitionOrigin}
        targetSettings={currentStarSettings}
      />


      <Sidebar
        pins={visibleItems}
        onSelectPin={(id) => { setSelectedItemId(id); }}
        onDeletePin={handleDeleteLocation}
        onExport={() => {
          const data = JSON.stringify({ items, rootMapImage, isDarkMode });
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          const project = projects.find(p => p.id === currentProjectId);
          const projectName = project ? project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'map-wiki';
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectName}-${timestamp}.json`;
          a.click();
        }}
        onImport={(e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const p = JSON.parse(ev.target.result);
              if (p.items) setItems(p.items);
              else if (p.pins) setItems(p.pins.map(x => ({ ...x, type: 'location' }))); // Migration

              if (p.rootMapImage) setRootMapImage(p.rootMapImage);
            };
            reader.readAsText(file);
          }
        }}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        breadcrumbs={getBreadcrumbs()}
        projectName={(projects.find(p => p.id === currentProjectId) || {}).name || 'Wiki Map'}
        onNavigate={setCurrentViewId}
        onBack={handleBackToDashboard}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onOpenAtlas={() => setShowAtlas(true)}
        onExportImage={handleExportImage}
        isGlobalEditMode={isGlobalEditMode}
        onToggleGlobalEdit={() => setIsGlobalEditMode(!isGlobalEditMode)}
        starSettings={currentStarSettings}
        onUpdateStarSettings={handleUpdateStarSettings}
        onResetStarSettings={handleResetStarSettings}
      />

      {/* Map area - no separate transition layer, MapCanvas handles its own animations */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {/* Floating View/Edit Toggle */}
        <div
          className="toggle-switch"
          onClick={() => { sfx.playUiSelect(); setIsGlobalEditMode(!isGlobalEditMode); }}
          title={isGlobalEditMode ? "Switch to View Mode" : "Switch to Edit Mode"}
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            zIndex: 30,
          }}
        >
          <div className={`toggle-option ${!isGlobalEditMode ? 'active' : ''}`}>View</div>
          <div className={`toggle-option ${isGlobalEditMode ? 'active' : ''}`}>Edit</div>
          <div className={`toggle-slider ${isGlobalEditMode ? 'right' : 'left'}`} />
        </div>

        <MapCanvas
          mapImage={getCurrentMapImage()}
          pins={visibleItems}
          onSelectPin={(id, origin) => {
            if (transitionMode) return;
            if (connectingSourceId) {
              if (id && id !== connectingSourceId) {
                setItems(prev => prev.map(item => {
                  if (item.id === connectingSourceId) {
                    const connections = item.connections || [];
                    if (connections.includes(id)) {
                      return { ...item, connections: connections.filter(c => c !== id) };
                    }
                    return { ...item, connections: [...connections, id] };
                  }
                  return item;
                }));
                sfx.playUiSelect();
              }
              setConnectingSourceId(null);
              return;
            }

            if (selectedItemId === id) {
              const item = items.find(i => i.id === id);
              if (item && item.mapImage) {
                sfx.playEnterMap();
                handleNavigate(id, 'in', origin);
              }
            } else {
              setSelectedItemId(id);
            }
          }}
          selectedPinId={selectedItemId}
          connectingSourceId={connectingSourceId}
          onContextMenu={handleRightClick}
          onPinContextMenu={handlePinRightClick}
          isEditing={isGlobalEditMode}
          onPinMove={(id, x, y) => {
            setItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
          }}
          transitionMode={transitionMode}
          transitionOrigin={transitionOrigin}
          isGlobalEditMode={isGlobalEditMode}
        />
      </div>


      <ContextMenu
        {...contextMenu}
        onAddLocation={handleAddLocation}
        onEditPin={() => {
          if (contextMenu.targetId) {
            setSelectedItemId(contextMenu.targetId);
          }
        }}
        onConnect={() => {
          if (contextMenu.targetId) {
            setConnectingSourceId(contextMenu.targetId);
            // Maybe show a toast or change cursor?
          }
        }}
        onDeletePin={() => {
          if (contextMenu.targetId) {
            handleDeleteLocation(contextMenu.targetId);
          }
        }}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
      />

      {/* Top Left Controls (Back Button) */}
      {
        currentViewId !== 'root' && (
          <div style={{ position: 'absolute', top: '1rem', left: '320px', zIndex: 100 }}>
            <button
              className="btn-primary"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => {
                const currentItem = items.find(i => i.id === currentViewId);
                if (currentItem) {
                  handleNavigate(currentItem.parentId, 'out');
                } else {
                  handleNavigate('root', 'out');
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back
            </button>
          </div>
        )
      }

      {/* Top Right Controls */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100, display: 'flex', gap: '0.5rem' }}>
        {/* Delete Map Button */}
        {getCurrentMapImage() && isGlobalEditMode && !selectedItem && (
          <button
            className="btn-danger"
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onClick={handleDeleteMap}
            title="Delete Current Map Image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        )}

        {/* Location Info Button (when inside a sub-location) */}
        {currentViewId !== 'root' && !selectedItem && (
          <button
            className="btn-primary"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onClick={() => setSelectedItemId(currentViewId)}
          >
            Location Info
          </button>
        )}
      </div>

      {
        showAtlas && (
          <AtlasView
            items={items}
            currentViewId={currentViewId}
            onNavigate={setCurrentViewId}
            onSelect={setSelectedItemId}
            onClose={() => setShowAtlas(false)}
          />
        )
      }

      {
        activeEditorItem && (
          <WikiEditor
            selectedPin={activeEditorItem}
            isVisible={isWikiVisible}
            onExited={() => setActiveEditorItem(null)}
            isEditing={isGlobalEditMode}
            onClose={() => setSelectedItemId(null)}
            onDelete={() => handleDeleteLocation(activeEditorItem.id)}
            items={items}
            onRemoveConnection={(targetId) => {
              setItems(prev => prev.map(i => {
                if (i.id === activeEditorItem.id) {
                  return { ...i, connections: (i.connections || []).filter(c => c !== targetId) };
                }
                return i;
              }));
            }}
            onSave={(id, updates) => {
              setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
            }}
            onEnterMap={(id) => {
              handleNavigate(id, 'in');
            }}
            isGlobalEditMode={isGlobalEditMode}
          />
        )
      }
    </div >
  );
}
export default App;
