/**
 * Spark'it Database Configuration
 * External Database: JSONBin.io (Free tier: 10,000 requests/month)
 * 
 * Setup Instructions:
 * 1. Create free account at https://jsonbin.io
 * 2. Create a new bin
 * 3. Copy your API Key and Bin ID below
 * 4. Keep API Key secret - never commit to public repos
 */

const DB_CONFIG = {
  // ═══════════════════════════════════════════════════════════════
  // JSONBin.io Configuration - Setup Instructions:
  // 1. Create free account at https://jsonbin.io
  // 2. Go to Settings → Copy X-Master-Key
  // 3. Create a new Bin → Copy Bin ID from URL
  // 4. Replace the placeholders below
  // ═══════════════════════════════════════════════════════════════
  
  // WARNING: Keep your API Key secret! Never commit it to public repos!
  API_KEY: '$2a$10$p3YiC9HQugez5nmQzgmZl.bo8mabAcfNVgAKkQ3C2wKX6B6dWqX0S', // Replace with your X-Master-Key
  
  // Bin ID from your JSONBin URL: https://api.jsonbin.io/v3/b/YOUR_BIN_ID
  BIN_ID: '69e7752736566621a8d7ab1d', // Replace with your actual Bin ID
  
  // API Endpoints
  BASE_URL: 'https://api.jsonbin.io/v3/b',
  
  // Cache settings
  CACHE_KEY: 'spark.dbCache',
  LAST_SYNC_KEY: 'spark.lastSync',
  
  // Sync interval in milliseconds (5 minutes)
  SYNC_INTERVAL: 5 * 60 * 1000,
  
  // Version tracking
  VERSION_KEY: 'spark.dbVersion'
};

// Default data structure
const DEFAULT_DATA = {
  version: 1,
  timestamp: Date.now(),
  sharedIdeas: [],
  sharedImages: [],
  customIdeas: [],
  editedIdeas: {},
  deletedIdeas: [],
  history: {
    date: [],
    short: [],
    fullday: []
  }
};

// Database Manager Class
class SparkDatabase {
  constructor(config) {
    this.config = config;
    this.data = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database - load from cache or create default
   */
  async init() {
    try {
      // Try to load from cache first
      const cached = this.loadFromCache();
      if (cached) {
        this.data = this.validateData(cached);
        console.log('DB: Loaded from cache, version', this.data.version);
      } else {
        this.data = { ...DEFAULT_DATA };
      }

      // Mark as initialized immediately so UI can work with cached data
      this.isInitialized = true;

      // Only try to sync if database is configured
      if (this.isConfigured()) {
        // Sync with remote database (with timeout)
        try {
          await Promise.race([
            this.syncFromRemote(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('DB sync timeout')), 5000)
            )
          ]);
        } catch (syncError) {
          console.warn('DB: Remote sync failed, using local data:', syncError.message);
        }
        
        // Start auto-sync only if configured
        this.startAutoSync();
      } else {
        console.log('DB: Not configured, using localStorage only');
      }
      
      return true;
    } catch (error) {
      console.error('DB Init Error:', error);
      this.data = this.loadFromCache() || { ...DEFAULT_DATA };
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Check if database is configured
   */
  isConfigured() {
    return this.config.BIN_ID && 
           !this.config.BIN_ID.includes('YOUR_BIN') &&
           this.config.API_KEY &&
           !this.config.API_KEY.includes('YOUR_API_KEY');
  }

  /**
   * Build API URL
   */
  getApiUrl() {
    return `${this.config.BASE_URL}/${this.config.BIN_ID}`;
  }

  /**
   * Validate and fix data structure
   */
  validateData(data) {
    const validated = { ...DEFAULT_DATA };
    if (!data) return validated;

    // Copy version and timestamp if valid
    if (data.version) validated.version = data.version;
    if (data.timestamp) validated.timestamp = data.timestamp;

    // Ensure arrays exist
    validated.sharedIdeas = Array.isArray(data.sharedIdeas) ? data.sharedIdeas : [];
    validated.sharedImages = Array.isArray(data.sharedImages) ? data.sharedImages : [];
    validated.customIdeas = Array.isArray(data.customIdeas) ? data.customIdeas : [];
    validated.deletedIdeas = Array.isArray(data.deletedIdeas) ? data.deletedIdeas : [];

    // Ensure editedIdeas is an object
    validated.editedIdeas = (data.editedIdeas && typeof data.editedIdeas === 'object') ? data.editedIdeas : {};

    // Ensure history has all categories
    validated.history = {
      date: Array.isArray(data.history?.date) ? data.history.date : [],
      short: Array.isArray(data.history?.short) ? data.history.short : [],
      fullday: Array.isArray(data.history?.fullday) ? data.history.fullday : []
    };

    return validated;
  }

  /**
   * Fetch data from remote database
   */
  async fetchFromRemote() {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await Promise.race([
        fetch(this.getApiUrl(), {
          method: 'GET',
          mode: 'cors',
          headers: {
            'X-Master-Key': this.config.API_KEY,
            'X-Bin-Meta': 'false'
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), 10000)
        )
      ]);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('DB: Bin not found, will create on first save');
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.record || result;
    } catch (error) {
      console.warn('DB: Fetch failed:', error.message);
      return null;
    }
  }

  /**
   * Save data to remote database
   */
  async saveToRemote() {
    // Always save to cache first
    this.saveToCache();
    
    // Only try remote save if configured
    if (!this.isConfigured()) {
      console.log('DB: Not configured, saved to localStorage only');
      return false;
    }

    try {
      // Update version and timestamp
      this.data.version = (this.data.version || 0) + 1;
      this.data.timestamp = Date.now();

      // Save with extended timeout for larger data
      const response = await Promise.race([
        fetch(this.getApiUrl(), {
          method: 'PUT',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': this.config.API_KEY
          },
          body: JSON.stringify(this.data)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Save timeout')), 15000)
        )
      ]);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('HTTP 403 - API Key oder Bin Einstellungen falsch. Prüfe: 1) API Key kopiert aus Settings, 2) Bin ist auf Public, 3) Bin ID stimmt');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      localStorage.setItem(this.config.LAST_SYNC_KEY, Date.now().toString());
      
      console.log('DB: Saved to remote, version', this.data.version);
      return true;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.warn('DB: CORS or network error - this is normal when testing locally. On GitHub Pages this should work.');
      } else if (error.message.includes('403')) {
        console.error('DB: AUTHORIZATION ERROR - Check your JSONBin.io settings:');
        console.error('  1. Go to https://jsonbin.io/app/settings');
        console.error('  2. Copy X-Master-Key (starts with $2a$10$...)');
        console.error('  3. Make sure your Bin is PUBLIC (unlock icon)');
        console.error('  4. Verify BIN_ID matches your Bin URL');
      }
      console.warn('DB: Remote save failed, data in localStorage:', error.message);
      return false;
    }
  }

  /**
   * Sync from remote - merge or overwrite based on version
   */
  async syncFromRemote() {
    const remote = await this.fetchFromRemote();

    if (!remote) {
      console.log('DB: No remote data, using local');
      return;
    }

    // Validate remote data before using it
    const validatedRemote = this.validateData(remote);

    const localVersion = this.data?.version || 0;
    const remoteVersion = validatedRemote.version || 0;

    if (remoteVersion > localVersion) {
      console.log('DB: Remote is newer (', remoteVersion, '>', localVersion, '), updating local');
      this.data = validatedRemote;
      this.saveToCache();
    } else if (remoteVersion < localVersion) {
      console.log('DB: Local is newer (', localVersion, '>', remoteVersion, '), pushing to remote');
      await this.saveToRemote();
    } else {
      console.log('DB: Versions match (', localVersion, '), no sync needed');
    }
  }

  /**
   * Force push local data to remote
   */
  async forcePush() {
    return await this.saveToRemote();
  }

  /**
   * Force pull from remote
   */
  async forcePull() {
    const remote = await this.fetchFromRemote();
    if (remote) {
      this.data = this.validateData(remote);
      this.saveToCache();
      return true;
    }
    return false;
  }

  /**
   * Save to localStorage cache (without images to avoid quota issues)
   */
  saveToCache() {
    try {
      // Create cache without images (they're too large for localStorage)
      const cacheData = { ...this.data };
      if (cacheData.sharedImages && cacheData.sharedImages.length > 0) {
        // Only cache image metadata, not the base64 data
        cacheData.sharedImages = cacheData.sharedImages.map(img => ({
          ...img,
          data: null, // Don't cache image data
          cached: false
        }));
      }
      localStorage.setItem(this.config.CACHE_KEY, JSON.stringify(cacheData));
      console.log('DB: Saved to cache (without images)');
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('DB: localStorage full, skipping cache');
      } else {
        console.error('DB Cache Error:', error);
      }
    }
  }

  /**
   * Load from localStorage cache
   */
  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.config.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('DB Load Cache Error:', error);
      return null;
    }
  }

  /**
   * Clear localStorage cache to free space
   */
  clearCache() {
    try {
      localStorage.removeItem(this.config.CACHE_KEY);
      localStorage.removeItem(this.config.LAST_SYNC_KEY);
      console.log('DB: Cache cleared');
    } catch (error) {
      console.error('DB Clear Cache Error:', error);
    }
  }

  /**
   * Start auto-sync interval
   */
  startAutoSync() {
    setInterval(() => {
      if (this.isInitialized) {
        this.syncFromRemote();
      }
    }, this.config.SYNC_INTERVAL);
  }

  // Data Access Methods

  getAllData() {
    return this.data;
  }

  getCustomIdeas() {
    return this.data?.customIdeas || [];
  }

  getEditedIdeas() {
    return this.data?.editedIdeas || {};
  }

  getDeletedIdeas() {
    return this.data?.deletedIdeas || [];
  }

  getSharedImages() {
    return this.data?.sharedImages || [];
  }

  getHistory() {
    const defaultHistory = { date: [], short: [], fullday: [] };
    if (!this.data || !this.data.history) {
      return defaultHistory;
    }
    // Ensure all category arrays exist
    return {
      date: this.data.history.date || [],
      short: this.data.history.short || [],
      fullday: this.data.history.fullday || []
    };
  }

  // Data Modification Methods

  async addCustomIdea(idea) {
    if (!this.data.customIdeas) {
      this.data.customIdeas = [];
    }
    this.data.customIdeas.push({
      ...idea,
      id: idea.id || Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    return await this.saveToRemote();
  }

  async updateCustomIdea(id, updates) {
    const index = this.data.customIdeas?.findIndex(i => i.id === id);
    if (index !== -1) {
      this.data.customIdeas[index] = { ...this.data.customIdeas[index], ...updates };
      return await this.saveToRemote();
    }
    return false;
  }

  async deleteCustomIdea(id) {
    if (this.data.customIdeas) {
      this.data.customIdeas = this.data.customIdeas.filter(i => i.id !== id);
      return await this.saveToRemote();
    }
    return false;
  }

  async saveEdit(ideaId, patch) {
    if (!this.data.editedIdeas) {
      this.data.editedIdeas = {};
    }
    this.data.editedIdeas[ideaId] = { 
      ...(this.data.editedIdeas[ideaId] || {}), 
      ...patch,
      editedAt: new Date().toISOString()
    };
    return await this.saveToRemote();
  }

  async deleteIdea(ideaId) {
    if (!this.data.deletedIdeas) {
      this.data.deletedIdeas = [];
    }
    if (!this.data.deletedIdeas.includes(ideaId)) {
      this.data.deletedIdeas.push(ideaId);
      return await this.saveToRemote();
    }
    return false;
  }

  async restoreIdea(ideaId) {
    if (this.data.deletedIdeas) {
      this.data.deletedIdeas = this.data.deletedIdeas.filter(id => id !== ideaId);
      return await this.saveToRemote();
    }
    return false;
  }

  async addSharedImage(imageData) {
    // Check image size (JSONBin.io free tier has ~100KB limit per request)
    const MAX_SIZE = 80 * 1024; // 80KB max to be safe
    const imageSize = imageData.data ? imageData.data.length : 0;
    
    if (imageSize > MAX_SIZE) {
      throw new Error(`Bild zu groß (${Math.round(imageSize/1024)}KB). Maximal 80KB erlaubt.`);
    }
    
    if (!this.data.sharedImages) {
      this.data.sharedImages = [];
    }
    
    // Limit number of images stored
    const MAX_IMAGES = 20;
    if (this.data.sharedImages.length >= MAX_IMAGES) {
      this.data.sharedImages = this.data.sharedImages.slice(0, MAX_IMAGES - 1);
    }
    
    const newImage = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      data: imageData.data,
      filename: imageData.filename,
      uploadedAt: new Date().toISOString(),
      uploadedBy: imageData.uploadedBy || 'User'
    };
    this.data.sharedImages.unshift(newImage);
    return await this.saveToRemote();
  }

  async deleteSharedImage(imageId) {
    if (this.data.sharedImages) {
      this.data.sharedImages = this.data.sharedImages.filter(img => img.id !== imageId);
      return await this.saveToRemote();
    }
    return false;
  }

  async saveHistory(history) {
    this.data.history = history;
    return await this.saveToRemote();
  }

  async clearAllData() {
    this.data = { ...DEFAULT_DATA, timestamp: Date.now() };
    return await this.saveToRemote();
  }

  // Migration from old localStorage structure
  async migrateFromLocalStorage() {
    const oldKeys = {
      customIdeas: 'spark.customIdeas',
      deletedIdeas: 'spark.deletedIdeas',
      editedIdeas: 'spark.editedIdeas',
      sharedImages: 'spark.sharedImages',
      history: 'spark.history'
    };

    let hasMigrated = false;

    for (const [key, storageKey] of Object.entries(oldKeys)) {
      try {
        const value = localStorage.getItem(storageKey);
        if (value) {
          const parsed = JSON.parse(value);
          
          // Skip migrating images - they're too large for the database
          if (key === 'sharedImages') {
            console.log('DB: Skipping image migration - images too large for database');
            // Clear old images from localStorage to free space
            localStorage.removeItem(storageKey);
            continue;
          }
          
          if (key === 'history') {
            this.data.history = { ...this.data.history, ...parsed };
          } else {
            this.data[key] = parsed;
          }
          hasMigrated = true;
          console.log('DB: Migrated', key, 'from localStorage');
          
          // Clear old key to free localStorage space
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.warn('DB: Failed to migrate', key, e);
      }
    }

    if (hasMigrated) {
      await this.saveToRemote();
    }

    return hasMigrated;
  }
}

// Create global instance
const sparkDB = new SparkDatabase(DB_CONFIG);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SparkDatabase, DB_CONFIG, sparkDB };
}
