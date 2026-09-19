const mongoose = require("mongoose");

const publisherSchema = new mongoose.Schema(
    {
        publisherId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        phoneNumber: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Publisher", publisherSchema);