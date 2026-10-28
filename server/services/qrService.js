const QRCode = require("qrcode");

// Must use the same fields and order as the signing code in studentController
const signaturePayload = (s) => ({
  apaarId: s.apaarId,
  institution: String(s.institution._id || s.institution),
  course: s.course,
  academicYear: s.academicYear,
  name: s.name,
});

const verifyUrl = (apaarId) =>
  `${process.env.CLIENT_URL || "http://localhost:5173"}/verify?apaarId=${apaarId}`;

const makeQR = async (apaarId) => {
  const url = verifyUrl(apaarId);
  const image = await QRCode.toDataURL(url, { width: 300, margin: 1 });
  return { url, image };
};

module.exports = { signaturePayload, verifyUrl, makeQR };