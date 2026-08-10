const Product = require("../../models/product.model");

module.exports.index = async (req, res) => {

    const featuredProducts = await Product.find({
        deleted: false,
        status: "active"
    })
    .sort({ createdAt: -1 })
    .limit(6);

    res.render("client/pages/home/index", {
        featuredProducts
    });

}