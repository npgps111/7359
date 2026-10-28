// Vercel function for /api/comments/:slug/:id (edit/delete a user comment)
const { handleApi } = require('../../../server.js');

module.exports = async (req, res) => {
  return handleApi(req, res, '/api/comments/' + (req.query.slug || '') + '/' + (req.query.id || ''));
};
