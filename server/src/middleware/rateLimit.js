const requests = new Map();

const rateLimit = ({
  windowMs = 60 * 1000,
  maxRequests = 30
} = {}) => {
  return (req, res, next) => {
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();

    const record = requests.get(key);

    if (!record || now - record.start >= windowMs) {
      requests.set(key, {
        start: now,
        count: 1
      });

      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please try again later."
      });
    }

    next();
  };
};

module.exports = rateLimit;