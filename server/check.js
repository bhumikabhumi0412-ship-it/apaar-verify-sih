require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB name:", mongoose.connection.name);
  console.log("Total users:", await User.countDocuments());
  const u = await User.findOne({ email: "student@apaar.test" });
  console.log("User found:", !!u);
  if (u) console.log("Password matches:", await bcrypt.compare("Student@123", u.password));
  await mongoose.disconnect();
})();
