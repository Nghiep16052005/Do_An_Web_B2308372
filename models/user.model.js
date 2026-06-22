const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: String,

    email: {
        type: String,
        unique: true
    },

    password: String,

    token: String,

    status: {
        type: String,
        default: "active"
    }
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;