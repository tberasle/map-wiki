import StorageManager from './StorageManager';

const DEFAULT_STAR_SETTINGS = {
    starColor: '#ffffff',
    bgColor: '#000000',
    speed: 0.5,
    twinkleSpeed: 0.5,
    intensity: 0.3 // Reduced from 0.8
};

const ProjectLoader = {
    loadSampleProjects: async (modules) => {
        let newSamples = [];

        for (const path in modules) {
            try {
                const mod = await modules[path]();
                const rawData = mod.default || mod;

                if (!rawData) {
                    console.warn("Skipping empty sample:", path);
                    continue;
                }

                // Handle legacy/simple JSONs missing ID/Name
                let projectData = { ...rawData };

                if (!projectData.id) {
                    // Generate ID from filename
                    const filename = path.split('/').pop().replace('.json', '');
                    // Create a stable-ish ID from filename
                    projectData.id = `sample-${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                    // Use filename as name if missing
                    if (!projectData.name) {
                        projectData.name = filename;
                    }
                }

                // Check if project already exists in IDB
                let exists = false;
                try {
                    exists = await StorageManager.projectExists(projectData.id);
                } catch (e) {
                    console.error("Error checking check existence:", e);
                }

                if (!exists) {
                    // Ensure data has required fields
                    const safeData = {
                        items: [], // Default empty items if missing
                        rootMapImage: null,
                        isDarkMode: projectData.isDarkMode ?? true,
                        rootStarSettings: projectData.rootStarSettings || DEFAULT_STAR_SETTINGS,
                        ...projectData, // Overwrite defaults with actual data
                        lastModified: Date.now() // Always set fresh mod time for import
                    };

                    await StorageManager.saveProject(safeData);
                    console.log("Imported sample:", safeData.name, "ID:", safeData.id);

                    newSamples.push({
                        id: safeData.id,
                        name: safeData.name,
                        lastModified: safeData.lastModified
                    });
                }
            } catch (err) {
                console.error("Error processing sample:", path, err);
            }
        }
        return newSamples;
    }
};

export default ProjectLoader;
