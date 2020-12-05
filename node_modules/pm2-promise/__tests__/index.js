const pm2 = require('../index');
const API = pm2.custom;

describe('PM2 promise test suite', () => {
  it('Should have non-zero methods', () => {
    const methods = Object.keys(API.prototype);
    expect(methods.length).toBeGreaterThan(0);
  });

  it('Should have the same methods as original PM2', () => {
    Object.keys(API.prototype).forEach(name => {
      expect(typeof pm2[name]).toBe('function');
    });
  });

  it('Should be able to connect to daemon', async () => {
    await pm2.connect();
    const bus = await pm2.launchBus();
    expect(bus).toBeDefined();
    await pm2.close();
  });
});


