// Vercel function for /api/comments/:slug
const { handleApi } = require('../../server.js');

module.exports = async (req, res) => {
  return handleApi(req, res, '/api/comments/' + (req.query.slug || ''));
};
