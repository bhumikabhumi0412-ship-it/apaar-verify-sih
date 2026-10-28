module.exports = (err, req, res, next) => {
  console.error(err.message);
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  res.status(status).json({ message: err.message || "Server error" });
};