const Sequelize = require("sequelize");
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");

const SALT_ROUNDS = 5;

const User = db.define("user", {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
  },
  role: {
    type: Sequelize.ENUM,
    values: ["Supervisor", "Manager", "Technician"],
    defaultValue: "Technician",
  },
  department: {
    type: Sequelize.ENUM,
    values: ["R&D", "Sales", "Business", "QA", "Production", "Applications"],
    allowNull: true,
    defaultValue: "Sales",
  },
});

module.exports = User;

/**
 * instanceMethods
 */
User.prototype.correctPassword = function (candidatePwd) {
  //we need to compare the plain version to an encrypted version of the password
  return bcrypt.compare(candidatePwd, this.password);
};

User.prototype.generateToken = function () {
  return jwt.sign({ id: this.id }, process.env.JWT);
};

/**
 * classMethods
 */
User.authenticate = async function ({ username, password }) {
  const user = await this.findOne({ where: { username } });
  if (!user || !(await user.correctPassword(password))) {
    const error = Error("Incorrect username/password");
    error.status = 401;
    throw error;
  }
  return user.generateToken();
};

User.findByToken = async function (token) {
  try {
    const { id } = await jwt.verify(token, process.env.JWT);
    // const user = User.findByPk(id);
    const user = User.findOne({
      where: {
        id,
      },
      include: [
        {
          model: User,
          as: "manager",
        },
      ],
    });
    if (!user) {
      throw "nooo";
    }
    return user;
  } catch (ex) {
    const error = Error("bad token");
    error.status = 401;
    throw error;
  }
};

/**
 * hooks
 */
const hashPassword = async (user) => {
  //in case the password has been changed, we want to encrypt it with bcrypt
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
  }
};

User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);
User.beforeBulkCreate((users) => Promise.all(users.map(hashPassword)));

User.updateUser = async function (userReq, id) {
  console.log(userReq, id);
  let user = await this.findByPk(id * 1);
  user = await this.update(userReq);
  return user;
};
User.createUser = async function (user) {
  return await this.create(user);
};

User.deleteUser = async function (id) {
  const user = await this.findByPk(id * 1);
  await user.destroy();
  return;
};
