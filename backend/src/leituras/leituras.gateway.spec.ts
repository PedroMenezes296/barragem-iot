import {
  LeiturasGateway,
  isAllowedWebsocketOrigin,
} from './leituras.gateway.js';

describe('LeiturasGateway', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('broadcasts only an invalidation identifier', () => {
    const gateway = new LeiturasGateway();
    const emit = vi.fn();
    Reflect.set(gateway, 'server', { emit });
    gateway.notifyCreated('saved-id');
    expect(emit).toHaveBeenCalledExactlyOnceWith('leitura:criada', {
      id: 'saved-id',
    });
  });

  it('does not fail persistence when broadcasting fails', () => {
    const gateway = new LeiturasGateway();
    Reflect.set(gateway, 'server', {
      emit: () => {
        throw new Error('Transport failed');
      },
    });
    expect(() => gateway.notifyCreated('saved-id')).not.toThrow();
  });

  it('allows configured browser origins and refuses other origins', () => {
    vi.stubEnv(
      'WS_ALLOWED_ORIGINS',
      'https://dashboard.example.com, http://localhost:3001',
    );
    expect(isAllowedWebsocketOrigin('https://dashboard.example.com')).toBe(
      true,
    );
    expect(isAllowedWebsocketOrigin('http://localhost:3001')).toBe(true);
    expect(isAllowedWebsocketOrigin('https://other.example.com')).toBe(false);
    expect(isAllowedWebsocketOrigin(undefined)).toBe(true);
  });
});
