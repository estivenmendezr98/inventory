/** Jest CJS stub — evita cargar el paquete ESM real en e2e. */
class MockKcAdmin {
  accessToken = '';
  registerTokenProvider() {}
  constructor() {}
  async auth() {
    const exp = Math.floor(Date.now() / 1000) + 7200;
    const mid = Buffer.from(JSON.stringify({ exp })).toString('base64');
    this.accessToken = `e2e.${mid}.mock`;
  }
}
module.exports = { __esModule: true, default: MockKcAdmin };
