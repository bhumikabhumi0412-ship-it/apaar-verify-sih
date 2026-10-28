const crypto = require("crypto");

const sign = (data) =>
  crypto
    .createHmac("sha256", process.env.HMAC_SECRET)
    .update(typeof data === "string" ? data : JSON.stringify(data))
    .digest("hex");

const verify = (data, signature) => {
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(String(signature || ""));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

module.exports = { sign, verify };