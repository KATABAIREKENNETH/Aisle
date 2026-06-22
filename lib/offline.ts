import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const STORAGE_PREFIX = 'aisle_offline_';
const QUEUE_KEY = `${STORAGE_PREFIX}queue`;

export class OfflineManager {
  private queue: QueuedAction[] = [];
  private isOnline: boolean = true;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadQueue();
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    // In a real app, you'd use NetInfo to detect network status
    // For now, we'll assume online
  }

  private async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  public async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    this.queue.push(queuedAction);
    await this.saveQueue();
  }

  public async processQueue() {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const processed: string[] = [];
    
    for (const action of this.queue) {
      try {
        await this.executeAction(action);
        processed.push(action.id);
      } catch (error) {
        console.error('Error processing action:', action, error);
      }
    }

    // Remove processed actions
    this.queue = this.queue.filter(a => !processed.includes(a.id));
    await this.saveQueue();
  }

  private async executeAction(action: QueuedAction) {
    // This would integrate with your API layer to execute the action
    console.log('Executing action:', action);
    // TODO: Implement actual API calls based on action type and table
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.processQueue();
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

// Zustand persist middleware
export function createPersistMiddleware<T>(key: string) {
  return (config: any) => {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    
    return {
      ...config,
      initialize: async (set: any, get: any, api: any) => {
        try {
          const stored = await AsyncStorage.getItem(storageKey);
          if (stored) {
            set(JSON.parse(stored));
          }
        } catch (error) {
          console.error('Error loading persisted state:', error);
        }
        
        if (config.initialize) {
          await config.initialize(set, get, api);
        }
      },
      setState: async (partial: any, replace: boolean) => {
        const result = config.setState(partial, replace);
        
        try {
          const state = config.getState();
          await AsyncStorage.setItem(storageKey, JSON.stringify(state));
        } catch (error) {
          console.error('Error persisting state:', error);
        }
        
        return result;
      },
    };
  };
}

// Singleton instance
export const offlineManager = new OfflineManager();
