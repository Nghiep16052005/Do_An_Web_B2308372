const Product = require("../../models/product.model");
module.exports.index = async (req, res) => {
    const product = await Product.find({
        status: "active",
        deleted: false

    });

    // product.forEach(item => {
    //     item.priceNew = (item.price*(100-item.discountPercentage)/100).toFixed(0);
    // }); 
    const newProducts = product.map(item => {
        item.priceNew = (item.price*(100-item.discountPercentage)/100).toFixed(0);
        return item;
    });
    console.log(newProducts);

    res.render("client/pages/products/index",{
        pageTitle: "Danh sach san pham",
        products: newProducts
    });
}