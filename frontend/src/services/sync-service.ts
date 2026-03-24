import offlineStorage from './offline-storage';

type SyncOperationType = 'create' | 'update' | 'delete';

interface SyncOperation {
  id?: number;
  operation: SyncOperationType;
  resource: string;
  data?: unknown | null;
  resourceId?: string | number | null;
  timestamp: number;
  createdAt?: string;
}

interface OfflineStorageApi {
  getSyncOperations: () => Promise<SyncOperation[]>;
  removeSyncOperation: (operationId: number | undefined) => Promise<unknown>;
  addSyncOperation: (operation: Omit<SyncOperation, 'id' | 'createdAt'>) => Promise<unknown>;
}

interface TokenResponse {
  accessToken?: string;
}

class SyncService {
  private syncInProgress = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly syncIntervalTime = 30000;
  private readonly storage = offlineStorage as OfflineStorageApi;

  async startSyncService() {
    this.syncInterval = setInterval(() => {
      void this.syncPendingOperations();
    }, this.syncIntervalTime);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        void this.syncPendingOperations();
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
      const operations = await this.storage.getSyncOperations();

      for (const operation of operations) {
        try {
          await this.executeSyncOperation(operation);
          await this.storage.removeSyncOperation(operation.id);
          console.log(`Sync operation completed: ${operation.operation} for ${operation.resource}`);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
        }
      }

      console.log('Sync process completed');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async executeSyncOperation(operation: SyncOperation) {
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

  async createResource(resource: string, data: unknown) {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/v1/${resource}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${resource}: ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  }

  async updateResource(resource: string, resourceId: string | number | null | undefined, data: unknown) {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/v1/${resource}/${resourceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${resource}: ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  }

  async deleteResource(resource: string, resourceId: string | number | null | undefined) {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/v1/${resource}/${resourceId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${resource}: ${response.status}`);
    }

    return true;
  }

  async getAuthToken() {
    const response = await fetch('/api/auth/token', {
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Unable to retrieve auth token');
    }

    const data = (await response.json()) as TokenResponse;
    if (!data.accessToken) {
      throw new Error('Unable to retrieve auth token');
    }

    return data.accessToken;
  }

  async queueOperation(
    operation: SyncOperationType,
    resource: string,
    data: unknown = null,
    resourceId: string | number | null = null
  ) {
    const syncOperation: Omit<SyncOperation, 'id' | 'createdAt'> = {
      operation,
      resource,
      data,
      resourceId,
      timestamp: Date.now(),
    };

    await this.storage.addSyncOperation(syncOperation);
    console.log(`Queued sync operation: ${operation} for ${resource}`);
  }
}

const syncService = new SyncService();

export default syncService;
