// sync-service.js
// Service to handle synchronization between offline storage and backend API

import offlineStorage from './offline-storage';

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.syncInterval = null;
    this.syncIntervalTime = 30000; // 30 seconds
  }

  async startSyncService() {
    // Start periodic sync
    this.syncInterval = setInterval(() => {
      this.syncPendingOperations();
    }, this.syncIntervalTime);

    // Also sync when the page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncPendingOperations();
      }
    });
  }

  async stopSyncService() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingOperations() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;

    try {
      console.log('Starting sync process...');
      const operations = await offlineStorage.getSyncOperations();

      for (const operation of operations) {
        try {
          await this.executeSyncOperation(operation);
          await offlineStorage.removeSyncOperation(operation.id);
          console.log(`Sync operation completed: ${operation.operation} for ${operation.resource}`);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          // Optionally, implement retry logic or mark for manual sync
        }
      }

      console.log('Sync process completed');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async executeSyncOperation(operation) {
    const { operation: op, resource, data, resourceId } = operation;

    switch (op) {
      case 'create':
        return this.createResource(resource, data);
      case 'update':
        return this.updateResource(resource, resourceId, data);
      case 'delete':
        return this.deleteResource(resource, resourceId);
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  async createResource(resource, data) {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/v1/${resource}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${resource}: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  async updateResource(resource, resourceId, data) {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/v1/${resource}/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${resource}: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  async deleteResource(resource, resourceId) {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/v1/${resource}/${resourceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${resource}: ${response.status}`);
    }

    return true;
  }

  async getAuthToken() {
    // This function should get the auth token from Clerk
    // Since this is a service file, we'll need to access the Clerk context differently
    // In a real implementation, this would need to be passed from the component
    // For now, we'll return a placeholder that would be replaced with actual token retrieval
    if (typeof window !== 'undefined' && window.Clerk) {
      return await window.Clerk.session.getToken();
    }
    // Fallback - in practice, you'd need to pass the token from the component
    throw new Error('Unable to retrieve auth token');
  }

  async queueOperation(operation, resource, data = null, resourceId = null) {
    const syncOperation = {
      operation,
      resource,
      data,
      resourceId,
      timestamp: Date.now()
    };

    await offlineStorage.addSyncOperation(syncOperation);
    console.log(`Queued sync operation: ${operation} for ${resource}`);
  }
}

// Create a singleton instance
const syncService = new SyncService();

export default syncService;