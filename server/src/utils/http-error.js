function createHttpError(statusCode, message, publicMessage = message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

function sendError(res, error, fallbackMessage = "Something went wrong") {
  const statusCode = error?.statusCode || error?.status || 500;
  const message =
    statusCode >= 500
      ? error?.publicMessage || fallbackMessage
      : error?.message || fallbackMessage;

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  createHttpError,
  sendError,
};
