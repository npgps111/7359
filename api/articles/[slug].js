// Vercel function for /api/articles/:slug
const { handleApi } = require('../../server.js');

module.exports = async (req, res) => {
  return handleApi(req, res, '/api/articles/' + (req.query.slug || ''));
};
