/**
 * Cross-plugin data cache with GC-friendly WeakRef support
 * Implements SharedStore wrapper around Map<key, WeakRef<any>>
 */

export class SharedStore {
  private store = new Map<string, WeakRef<any> | { deref: () => any }>();
  private registry = new FinalizationRegistry((key: string) => {
    // Clean up the WeakRef when the object is garbage collected
    this.store.delete(key);
  });

  /**
   * Get a value from the store
   */
  get<T>(key: string): T | undefined {
    const weakRef = this.store.get(key);
    if (!weakRef) {
      return undefined;
    }

    const value = weakRef.deref();
    if (value === undefined) {
      // Object was garbage collected, clean up the entry
      this.store.delete(key);
      return undefined;
    }

    return value as T;
  }

  /**
   * Set a value in the store
   */
  set<T>(key: string, value: T): void {
    // Remove existing entry if it exists
    if (this.store.has(key)) {
      this.delete(key);
    }

    // For primitive values, we don't use WeakRef as they can't be garbage collected
    if (this.isPrimitive(value)) {
      // Store primitives directly (they don't benefit from WeakRef)
      this.store.set(key, { deref: () => value });
    } else {
      // Use WeakRef for objects - TypeScript now knows value is an object
      const weakRef = new WeakRef(value as object);
      this.store.set(key, weakRef);

      // Register for cleanup when the object is garbage collected
      this.registry.register(value as object, key);
    }
  }

  /**
   * Check if a key exists in the store
   */
  has(key: string): boolean {
    const weakRef = this.store.get(key);
    if (!weakRef) {
      return false;
    }

    const value = weakRef.deref();
    if (value === undefined) {
      // Object was garbage collected, clean up the entry
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the store
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all entries from the store
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get all keys currently in the store (excluding garbage collected entries)
   */
  keys(): string[] {
    const validKeys: string[] = [];
    for (const [key, weakRef] of this.store.entries()) {
      if (weakRef.deref() !== undefined) {
        validKeys.push(key);
      } else {
        // Clean up garbage collected entries
        this.store.delete(key);
      }
    }
    return validKeys;
  }

  /**
   * Get the number of valid entries in the store
   */
  size(): number {
    return this.keys().length;
  }

  /**
   * Check if a value is a primitive type
   */
  private isPrimitive(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'symbol' ||
      typeof value === 'bigint'
    );
  }
}
