const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(

    {

        user_id: {
            type: String,
            default: ""
        },

        products: [

            {

                product_id: {
                    type: String,
                    required: true
                },

                quantity: {
                    type: Number,
                    default: 1
                }

            }

        ]

    },

    {

        timestamps: true

    }

);

const Cart = mongoose.model(
    "Cart",
    cartSchema,
    "carts"
);

module.exports = Cart;