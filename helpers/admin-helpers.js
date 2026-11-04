var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
require("dotenv").config();

module.exports = {
  doLogin: async (adminData) => {
    if (
      !adminData ||
      typeof adminData.email !== "string" ||
      typeof adminData.password !== "string"
    ) {
      return { status: false };
    }

    const admins = db.getDb().collection(collections.ADMIN_COLLECTION);
    const admin = await admins.findOne({ email: adminData.email });

    if (admin) {
      const passwordMatches = await bcrypt.compare(
        adminData.password,
        admin.password,
      );
      if (!passwordMatches) {
        return { status: false };
      }

      const { password, ...sessionAdmin } = admin;
      return { status: true, admin: sessionAdmin };
    }

    if (
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD ||
      adminData.email !== process.env.ADMIN_EMAIL ||
      adminData.password !== process.env.ADMIN_PASSWORD
    ) {
      return { status: false };
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const result = await admins.insertOne({
      email: adminData.email,
      password: hashedPassword,
    });

    return {
      status: true,
      admin: { _id: result.insertedId, email: adminData.email },
    };
  },
};