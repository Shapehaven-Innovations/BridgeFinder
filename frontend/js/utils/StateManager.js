// frontend/js/utils/StateManager.js

export class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.subscribers = new Map();
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * Get state value by key or entire state
   */
  get(key) {
    if (!key) return { ...this.state };
    return this.state[key];
  }

  /**
   * Set state value(s) - supports both single key-value and object updates
   */
  set(keyOrObject, value) {
    const oldState = { ...this.state };

    if (typeof keyOrObject === "object") {
      this.state = { ...this.state, ...keyOrObject };
      Object.keys(keyOrObject).forEach((key) => {
        this.notify(key, this.state[key], oldState[key]);
      });
    } else {
      this.state[keyOrObject] = value;
      this.notify(keyOrObject, value, oldState[keyOrObject]);
    }

    this.addToHistory({ timestamp: Date.now(), state: { ...this.state } });
  }

  /**
   * Subscribe to state changes for a specific key or all changes (*)
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of state change
   */
  notify(key, newValue, oldValue) {
    if (newValue === oldValue) return;

    // Notify key-specific subscribers
    this.subscribers.get(key)?.forEach((callback) => {
      try {
        callback(newValue, oldValue);
      } catch (error) {
        console.error(`Subscriber error for key "${key}":`, error);
      }
    });

    // Notify wildcard subscribers
    this.subscribers.get("*")?.forEach((callback) => {
      try {
        callback({ key, newValue, oldValue });
      } catch (error) {
        console.error("Wildcard subscriber error:", error);
      }
    });
  }

  /**
   * Add state snapshot to history
   */
  addToHistory(entry) {
    this.history.push(entry);

    // Maintain history limit
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get state history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Reset state to initial or provided state
   */
  reset(initialState = {}) {
    const oldState = { ...this.state };
    this.state = initialState;

    Object.keys(oldState).forEach((key) => {
      this.notify(key, initialState[key], oldState[key]);
    });
  }
}
