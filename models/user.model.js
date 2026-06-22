const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    fullName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    token: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

    deleted: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
});

const User = mongoose.model("User", userSchema, "users");

module.exports = User;