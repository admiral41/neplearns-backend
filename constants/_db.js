const DB_TO_USE =
  process.env.NODE_ENV_PRODUCTION === "false"
    ? process.env.MONGO_DB_LOCAL
    : process.env.MONGO_DB_REMOTE;

console.log("DB:", DB_TO_USE);

module.exports = {
  DB_TO_USE,
};
