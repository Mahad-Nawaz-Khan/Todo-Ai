// offline-storage.js
// Service to handle offline storage using IndexedDB

class OfflineStorage {
  constructor() {
    this.dbName = 'TodoAppDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('user_id', 'user_id', { unique: false });
          taskStore.createIndex('created_at', 'created_at', { unique: false });
          taskStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('operation', 'operation', { unique: false });
        }
      };
    });
  }

  async addTask(task) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    // Ensure we're storing a plain object
    const taskToStore = {
      ...task,
      created_at: task.created_at instanceof Date ? task.created_at.toISOString() : task.created_at,
      updated_at: task.updated_at instanceof Date ? task.updated_at.toISOString() : task.updated_at,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(taskToStore);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTask(taskId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');

    return new Promise((resolve, reject) => {
      const request = store.get(taskId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTasks() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateTask(task) {
    // Same as addTask since put() will update if key exists
    return this.addTask(task);
  }

  async deleteTask(taskId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    return new Promise((resolve, reject) => {
      const request = store.delete(taskId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addSyncOperation(operation) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');

    const syncOperation = {
      ...operation,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.add(syncOperation);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncOperations() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['sync_queue'], 'readonly');
    const store = transaction.objectStore('sync_queue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncOperation(operationId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');

    return new Promise((resolve, reject) => {
      const request = store.delete(operationId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create a singleton instance
const offlineStorage = new OfflineStorage();

export default offlineStorage;