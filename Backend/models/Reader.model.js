const mongoose = require("mongoose");

const readerSchema = new mongoose.Schema(
    {
        readerId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true
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
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Reader", readerSchema);