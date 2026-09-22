const HttpError = require('../utils/httpError');

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...(err.extra || {}) });

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {}).map((e) => e.message).join(' ');
    return res.status(400).json({ message: message || 'Invalid data.' });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier.' });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body.' });

  console.error('[error]', err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
};

module.exports = { notFound, errorHandler };
