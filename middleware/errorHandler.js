// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  const isJsonParseError = err instanceof SyntaxError && err.status === 400 && 'body' in err;
  const status = isJsonParseError ? 400 : err.status || 500;

  let message = 'Internal Server Error';

  if (isJsonParseError) {
    message = 'Invalid JSON payload';
  } else if (status >= 400 && status < 500 && err.message) {
    message = err.message;
  }

  const errorLog = {
    method: req.method,
    path: req.originalUrl,
    status,
    message: err.message
  };

  if (process.env.NODE_ENV !== 'production') {
    errorLog.stack = err.stack;
  }

  console.error('[error]', errorLog);

  const response = {
    success: false,
    message
  };

  if (process.env.NODE_ENV !== 'production') {
    response.details = err.message;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
