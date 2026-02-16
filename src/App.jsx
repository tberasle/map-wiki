import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import WikiEditor from './components/WikiEditor';
import ContextMenu from './components/ContextMenu';
import Dashboard from './components/Dashboard';
import AtlasView from './components/AtlasView';
import Starfield from './components/Starfield';
import { sfx } from './utils/SoundManager';
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
  const [transitionMode, setTransitionMode] = useState(null); // 'zooming-in' | 'zooming-out' | null
  const [transitionOrigin, setTransitionOrigin] = useState(null); // { x, y } in percentages

  const [isGlobalEditMode, setIsGlobalEditMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [starSettings, setStarSettings] = useState({
    starColor: '#ffffff',
    bgColor: 'transparent',
    speed: 0, // Default to static (0 speed) as requested
    twinkleSpeed: 0.5, // New setting
    nebulaColor: '#4c1d95', // hex for purple-900 approx
    nebulaIntensity: 0.2
  });


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
  useEffect(() => {
    if (currentProjectId && viewMode === 'editor') {
      const dataToSave = {
        items,
        rootMapImage,
        isDarkMode
      };
      localStorage.setItem(`map-wiki-project-${currentProjectId}`, JSON.stringify(dataToSave));

      // Update Last Modified in Index (Debounced ideally, but this is fine for now)
      const updatedProjects = projects.map(p =>
        p.id === currentProjectId ? { ...p, lastModified: Date.now() } : p
      );
      // Only update state/storage if time changed significantly to avoid spamming? 
      // Actually, preventing infinite loops is key.
      // Let's NOT update 'projects' state here to avoid re-renders. 
      // Just update localStorage index silently.
      localStorage.setItem('map-wiki-index', JSON.stringify(updatedProjects));
    }
  }, [items, rootMapImage, isDarkMode, currentProjectId, viewMode]);

  // Project Management Functions
  const handleCreateProject = (name) => {
    const newProject = {
      id: Date.now().toString(),
      name: name,
      lastModified: Date.now()
    };

    // Initialize Empty Project Area
    const emptyData = { items: [], rootMapImage: null, isDarkMode: true };
    localStorage.setItem(`map-wiki-project-${newProject.id}`, JSON.stringify(emptyData));

    // Update Index
    const newIndex = [newProject, ...projects];
    setProjects(newIndex);
    localStorage.setItem('map-wiki-index', JSON.stringify(newIndex));

    // Open It
    handleLoadProject(newProject.id);
  };

  const handleLoadProject = (id) => {
    const dataStr = localStorage.getItem(`map-wiki-project-${id}`);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      // Load State
      setItems(data.items || []);
      setRootMapImage(data.rootMapImage || null);
      setIsDarkMode(data.isDarkMode !== undefined ? data.isDarkMode : true);

      // Reset View State
      setCurrentViewId('root');
      setSelectedItemId(null);
      setSelectedItemId(null);

      setCurrentProjectId(id);
      setViewMode('editor');
    } else {
      alert("Error: Project data not found!");
    }
  };

  const handleDeleteProject = (id) => {
    if (window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      // Remove Data
      localStorage.removeItem(`map-wiki-project-${id}`);

      // Update Index
      const newIndex = projects.filter(p => p.id !== id);
      setProjects(newIndex);
      localStorage.setItem('map-wiki-index', JSON.stringify(newIndex));
    }
  };

  const handleImportProject = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
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

          localStorage.setItem(`map-wiki-project-${newProject.id}`, JSON.stringify(data));

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

  const [transitionSnapshot, setTransitionSnapshot] = useState(null);

  const handleNavigate = (targetId, direction, origin = null) => {
    // 1. Capture Snapshot of current view (for Phase A animation)
    setTransitionSnapshot({
      pins: items.filter(i => i.parentId === currentViewId),
      mapImage: getCurrentMapImage()
    });

    const previousViewId = currentViewId;

    // 2. Setup Phase A (Exit)
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

    // 3. Switch View State IMMEDIATELY (Background)
    setCurrentViewId(targetId);
    setSelectedItemId(null);

    // 4. Wait for Phase A to complete (Exit Duration)
    setTimeout(() => {
      // 5. Setup Phase B (Enter)
      if (direction === 'in') {
        // entering-in: origin is already set correctly from click
        setTransitionMode('entering-in');
      } else {
        // entering-out: origin is already set correctly from childItem
        setTransitionMode('entering-out');
      }

      // 6. Wait for Phase B to complete
      setTimeout(() => {
        setTransitionMode(null);
        setTransitionOrigin(null);
        setTransitionSnapshot(null);
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
    path.unshift({ id: 'root', title: 'Home' });
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

  // RENDER
  if (viewMode === 'dashboard') {
    return (
      <Dashboard
        projects={projects}
        onCreateProject={handleCreateProject}
        onOpenProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onImportProject={handleImportProject}
      />
    );
  }

  return (
    <div
      className="app-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => setContextMenu({ ...contextMenu, visible: false })} // Close menu on global click
      style={{ backgroundColor: isDarkMode ? 'var(--bg-color)' : 'var(--bg-color)', color: 'var(--text-color)' }}
    >
      <Starfield
        warpMode={transitionMode}
        origin={transitionOrigin}
        settings={starSettings}
      />
      {/* Nebula Overlay (Optional, can be toggled) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(circle at 50% 50%, ${starSettings.nebulaColor || '#4c1d95'}, transparent 70%)`,
        opacity: starSettings.nebulaIntensity !== undefined ? starSettings.nebulaIntensity : 0.2,
        mixBlendMode: 'screen',
        transition: 'background 0.5s, opacity 0.5s'
      }} />

      {/* TRANSITION LAYER */}
      {transitionMode && (() => {
        const style = {};
        if ((transitionMode === 'entering-in' || transitionMode === 'zooming-out') && transitionOrigin) {
          const tx = transitionOrigin.x - 50;
          const ty = transitionOrigin.y - 50;
          style['--tx'] = `${tx}%`;
          style['--ty'] = `${ty}%`;
          style.transformOrigin = 'center center';
        } else {
          style.transformOrigin = transitionOrigin ? `${transitionOrigin.x}% ${transitionOrigin.y}%` : 'center center';
        }

        // Determine content for transition layer
        let targetPins = [];
        let targetMapImage = null;

        if (transitionMode.startsWith('zooming')) {
          // Phase A: Exit. SHOULD use snapshot, but fallback to current filtered items if snapshot failed.
          if (transitionSnapshot) {
            targetPins = transitionSnapshot.pins || [];
            targetMapImage = transitionSnapshot.mapImage;
            console.log("Rendering Zooming Layer with Snapshot:", { view: currentViewId, pins: targetPins.length, image: !!targetMapImage });
          } else {
            // Fallback: This might be wrong if currentViewId already changed, but better than nothing
            targetPins = items.filter(i => i.parentId === currentViewId);
            targetMapImage = getCurrentMapImage();
            console.log("Rendering Zooming Layer with Fallback:", { view: currentViewId, pins: targetPins.length });
          }
        } else {
          // Phase B: Enter. Always use current view (which should be the new target)
          targetPins = items.filter(i => i.parentId === currentViewId);
          targetMapImage = getCurrentMapImage();
        }

        style.opacity = 1; // Ensure visible for animation to handle fade out

        return (
          <div key={transitionMode} className={`transition-layer ${transitionMode}`} style={style}>
            <MapCanvas
              pins={targetPins}
              mapImage={targetMapImage}
              isGlobalEditMode={false}
              onSelectPin={() => { }}
            />
          </div>
        );
      })()}

      {/* Main Map Canvas - Hidden during transition to prevent ghosting */}
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
        onNavigate={setCurrentViewId}
        onBack={handleBackToDashboard}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onOpenAtlas={() => setShowAtlas(true)}
        onExportImage={handleExportImage}
        isGlobalEditMode={isGlobalEditMode}
        onToggleGlobalEdit={() => setIsGlobalEditMode(!isGlobalEditMode)}
        starSettings={starSettings}
        onUpdateStarSettings={setStarSettings}
      />

      <div style={{
        opacity: transitionMode ? 0 : 1,
        transition: 'opacity 0.1s',
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <MapCanvas
          mapImage={getCurrentMapImage()}
          pins={visibleItems}
          onSelectPin={(id, origin) => {
            if (transitionMode) return;
            // If in connecting mode
            if (connectingSourceId) {
              if (id && id !== connectingSourceId) {
                // Create connection
                setItems(prev => prev.map(item => {
                  if (item.id === connectingSourceId) {
                    const connections = item.connections || [];
                    // Toggle connection
                    if (connections.includes(id)) {
                      return { ...item, connections: connections.filter(c => c !== id) };
                    }
                    return { ...item, connections: [...connections, id] };
                  }
                  return item;
                }));
                sfx.playUiSelect();
              }
              setConnectingSourceId(null); // Exit mode
              return;
            }

            if (selectedItemId === id) {
              // Enter sub-location on second click
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
      {currentViewId !== 'root' && (
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
      )}

      {/* Top Right Controls */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100, display: 'flex', gap: '0.5rem' }}>
        {/* Delete Map Button */}
        {getCurrentMapImage() && (
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

      {showAtlas && (
        <AtlasView
          items={items}
          currentViewId={currentViewId}
          onNavigate={setCurrentViewId}
          onSelect={setSelectedItemId}
          onClose={() => setShowAtlas(false)}
        />
      )}

      {selectedItem && (
        <WikiEditor
          selectedPin={selectedItem}
          isEditing={isGlobalEditMode}
          onClose={() => setSelectedItemId(null)}
          onDelete={() => handleDeleteLocation(selectedItem.id)}
          items={items}
          onRemoveConnection={(targetId) => {
            setItems(prev => prev.map(i => {
              if (i.id === selectedItem.id) {
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
      )}
    </div>
  );
}
export default App;
