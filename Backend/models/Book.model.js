const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
    {
        bookId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        author: {
            type: String,
            required: true,
            trim: true
        },

        publisherId: {
            type: String,
            required: true,
            trim: true
        },

        publicationYear: {
            type: Number,
            required: true,
            min: 0
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Book", bookSchema);    