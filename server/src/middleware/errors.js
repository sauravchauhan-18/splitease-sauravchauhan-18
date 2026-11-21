export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({
      message: error.name === 'ValidationError' ? 'Please check the submitted values.' : 'The requested ID is not valid.',
      details: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A person with that name already exists.' });
  }

  console.error(error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : 'Something went wrong on the server.',
  });
}
