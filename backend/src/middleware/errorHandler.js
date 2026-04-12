/**
 * Global Express error-handling middleware.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, _req, res, _next) {
  console.error("Unhandled error:", err);

  const status = err.statusCode ?? err.status ?? 500;
  const message = err.message ?? "Internal Server Error";

  res.status(status).json({
    success: false,
    error: message,
  });
}
