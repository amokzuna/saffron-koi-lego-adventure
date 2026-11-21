type Listener<T> = (payload: T) => void;

/** Minimal strongly-typed event emitter, independent of Phaser so it can be unit-tested and used by React. */
export class TypedEmitter<Events extends Record<string, unknown>> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    (this.listeners[event] ??= new Set()).add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // Copy so listeners may unsubscribe during dispatch.
    for (const listener of [...(this.listeners[event] ?? [])]) listener(payload);
  }

  clear(): void {
    for (const key of Object.keys(this.listeners)) delete this.listeners[key as keyof Events];
  }
}
