const User = require("../models/User.Model");
const {
  hashPassword,
  STRIPE_SECRET_KEY,
  validateEmail,
  comparePassword,
  plans,
} = require("../utils/constants");
const stripe = require("stripe")(STRIPE_SECRET_KEY);
const UserController = {
  login: async (req, res) => {
    const { email, password } = req.body;
    const ifExits = await User.findOne({ email: email });
    if (!ifExits) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    if (ifExits.isDisabled || ifExits.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Your account is disabled",
      });
    }

    let dosePasswordMatch = comparePassword(password, ifExits.password);
    if (!dosePasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    } else {
      ifExits.password = undefined;
      ifExits.stripeCustomerId = undefined;
      return res.status(200).json({
        success: true,
        message: "Login Success",
        data: ifExits,
      });
    }
  },
  register: async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }
    const checkIfUserExists = await User.findOne({ email: email });
    if (checkIfUserExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be 6 characters long",
      });
    }

    const user = {
      name,
      email,
      password: hashPassword(password),
    };

    try {
      const newUser = await User.create(user);
      return res.status(200).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },
  getUser: async (req, res) => {
    const { userId } = req.query;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      user.password = undefined;
      return res.status(200).json({
        success: true,
        message: "User found",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },

  subscribe: async (req, res) => {
    const { subscriptionType, subscriptionMode } = req.body;
    const { userId } = req.query;
    if (!subscriptionType || !subscriptionMode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      var stripeCustomer;
      if (user.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      }
      const fetchPrices = await stripe.products.list();
      if (!fetchPrices) {
        return res.status(400).json({
          success: false,
          message: "Prices not found",
        });
      }
      const planPrice = fetchPrices?.data.find(
        (price) => price.name == `${subscriptionType}-${subscriptionMode}`
      )?.default_price;
      if (!stripeCustomer) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          description: "Customer for Provokes",
        });

        user.stripeCustomerId = customer.id;
      } else {
        if (!stripeCustomer.subscriptions) {
          await stripe.subscriptions.create({
            customer: stripeCustomer.id,
            items: [
              {
                price: planPrice,
              },
            ],
          });
        }
        const subscription = await stripe.subscriptions.retrieve(
          stripeCustomer.subscriptions.data[0].id
        );
        if (subscription) {
          return res.status(400).json({
            success: false,
            message: "Already subscribed",
          });
        } else {
          await stripe.subscriptions.create({
            customer: stripeCustomer.id,
            items: [
              {
                price: planPrice,
              },
            ],
          });
        }
        user.stripeCustomerId = stripeCustomer.id;
      }

      user.subscription = subscriptionType;
      user.subscriptionMode = subscriptionMode;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "User subscribed successfully",
        data: user,
      });
    } catch (error) {
        console.log(error)
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },
  unsubscribe: async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }

      const stripeCustomer = await stripe.customers.retrieve(
        user.stripeCustomerId
      );
      if (!stripeCustomer) {
        return res.status(400).json({
          success: false,
          message: "Stripe customer not found",
        });
      }
      const subscription = await stripe.subscriptions.retrieve(
        stripeCustomer.subscriptions.data[0].id
      );
      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "Subscription not found",
        });
      }
      await stripe.subscriptions.del(subscription.id);

      user.subscription = "free";
      user.subscriptionMode = "monthly";
      await user.save();
      return res.status(200).json({
        success: true,
        message: "User subscription cancelled successfully",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },
  addCard: async (req, res) => {
    const { userId } = req.query;
    const { cardNumber, expMonth, expYear, cvc } = req.body;
    if (!cardNumber || !expMonth || !expYear || !cvc) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      const stripeCustomer = await stripe.customers.retrieve(
        user.stripeCustomerId
      );
      if (!stripeCustomer) {
        return res.status(400).json({
          success: false,
          message: "Stripe customer not found",
        });
      }
      const card = await stripe.customers.createSource(stripeCustomer.id, {
        source:"tok_us"
      });
      return res.status(200).json({
        success: true,
        message: "Card added successfully",
        data: card,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },
};

module.exports = UserController;
