const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
    name: String,
    email: String,
    password: String,
    createdAt: { type: Date, default: Date.now },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    stripeCustomerId: String,
    subscription: { type: String, default: 'free', enum: ["mobile", "basic", "standard", "premium","free"] },
    subscriptionMode: { type: String, default: 'monthly', enum: ["monthly", "yearly"] },
});
    

module.exports = mongoose.model('User', UserSchema);