
const DB_NAME = 'DnDMapWikiDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

const StorageManager = {
    saveProject: async (projectData) => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(projectData);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    loadProject: async (id) => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    deleteProject: async (id) => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    projectExists: async (id) => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count(id);

            request.onsuccess = (event) => resolve(event.target.result > 0);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    // Migration helper: Try to load from localStorage first, move to IDB, then delete from LS
    migrateFromLocalStorage: async (projectId) => {
        const key = `map-wiki-project-${projectId}`;
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                // Ensure ID is present in data for keyPath
                if (!data.id) data.id = projectId;

                await StorageManager.saveProject(data);
                localStorage.removeItem(key); // Free up space!
                console.log(`Migrated project ${projectId} to IndexedDB.`);
                return data;
            } catch (e) {
                console.error("Migration failed for", projectId, e);
                return null;
            }
        }
        return null;
    }
};

export default StorageManager;
