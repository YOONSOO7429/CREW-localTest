require("dotenv").config();
const env = process.env;
const development = {
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  host: env.DB_HOST,
  dialect: "mysql",
  timezone: "Asia/Seoul",
  dialectOptions: {
    options: {
      requestTimeout: 3000,
    },
    timezone: "local",
  },
};
const production = {
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  host: env.DB_HOST,
  dialect: "mysql",
  timezone: "Asia/Seoul",
  dialectOptions: {
    options: {
      requestTimeout: 3000,
    },
    timezone: "local",
  },
};
const test = {
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  host: env.DB_HOST,
  dialect: "mysql",
  timezone: "Asia/Seoul",
  dialectOptions: {
    options: {
      requestTimeout: 3000,
    },
    timezone: "local",
  },
};
module.exports = { development, production, test };
