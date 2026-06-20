function parseAllowedOrigins() {
  return String(process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsOptionsDelegate(req, callback) {
  const allowedOrigins = parseAllowedOrigins();
  const origin = req.header("Origin");

  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, {
      origin: true,
      credentials: true,
    });
    return;
  }

  callback(null, {
    origin: false,
  });
}

module.exports = {
  corsOptionsDelegate,
  parseAllowedOrigins,
};
