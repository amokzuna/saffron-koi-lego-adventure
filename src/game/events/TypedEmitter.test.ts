import { describe, expect, it, vi } from 'vitest';
import { TypedEmitter } from './TypedEmitter';

describe('TypedEmitter', () => {
  it('delivers payloads to subscribers and supports unsubscribe', () => {
    const emitter = new TypedEmitter<{ ping: number }>();
    const listener = vi.fn();
    const off = emitter.on('ping', listener);
    emitter.emit('ping', 1);
    off();
    emitter.emit('ping', 2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  it('tolerates listeners removing themselves during emit', () => {
    const emitter = new TypedEmitter<{ ping: void }>();
    const second = vi.fn();
    const off = emitter.on('ping', () => off());
    emitter.on('ping', second);
    emitter.emit('ping', undefined);
    expect(second).toHaveBeenCalledOnce();
  });
});
