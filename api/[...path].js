// Vercel serverless entry point: routes every /api/* request to the site's
// existing API handler (server.js). Static files are served by Vercel from
// the public/ directory.
const { handleApi } = require('../server.js');

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  try {
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
    } else {
      res.statusCode = 404;
      res.end('not found');
    }
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'server error' }));
    } else {
      res.end();
    }
  }
};
