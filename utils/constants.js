const bcrypt = require("bcryptjs");

const STRIPE_SECRET_KEY =
  "sk_test_51ODJN0SBl3tVVm4ZdJOXUoZ7kJ7wS74nlSBk54HmU95APLjU97YF5kTgqcEPNOktaS07K21IVSfD1NyGsNOCuuVD00eqIEQV9Z";
const MONGODB_URL = "";
i48SvqEOaWRQZU9h;
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const comparePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

const validateEmail = (email) => {
  // eslint-disable-next-line no-useless-escape
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};
const plans = {
  monthly: {
    mobile: 100,
    basic: 200,
    standard: 500,
    premium: 700,
  },
  annual: {
    mobile: 1000,
    basic: 2000,
    standard: 5000,
    premium: 7000,
  },
};
module.exports = {
  hashPassword,
  comparePassword,
  STRIPE_SECRET_KEY,
  validateEmail,
  plans,
};
