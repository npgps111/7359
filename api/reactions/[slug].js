// Vercel function for /api/reactions/:slug (emoji reactions)
const { handleApi } = require('../../server.js');

module.exports = async (req, res) => {
  return handleApi(req, res, '/api/reactions/' + (req.query.slug || ''));
};
