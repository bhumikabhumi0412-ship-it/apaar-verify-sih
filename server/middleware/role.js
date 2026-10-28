// Usage: authorize("aicte_admin", "institution_admin")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied for your role" });
  }
  next();
};

module.exports = { authorize };