declare module 'isolated-vm' {
  export class Isolate {
    constructor(options?: { memoryLimit?: number; inspector?: boolean });

    createContext(): Promise<Context>;
    compileScript(code: string): Promise<Script>;
    dispose(): void;
    getHeapStatisticsSync(): {
      used_heap_size: number;
      total_heap_size: number;
    };
  }

  export class Context {
    global: Reference<any>;
  }

  export class Script {
    run(
      context: Context,
      options?: {
        timeout?: number;
        copy?: boolean;
      }
    ): Promise<any>;
  }

  export class Reference<T> {
    set(key: string, value: any): Promise<void>;
    get(key: string): Promise<any>;
    derefInto(): Reference<T>;
  }

  export class Callback<T extends (...args: any[]) => any = any> {
    constructor(value: T, options?: { async?: boolean });
  }

  export class ExternalCopy {
    constructor(value: any);
    copyInto(): any;
  }
}
