const Product = require("../../models/product.model");

module.exports.index = async (req, res) => {
    console.log("Da vao controller");
    const products = await Product.find({
        deleted: false,
        status: "active"
    });  

    //console.log("===================================")
    
   //console.log(products[0]); 
    res.render("client/pages/products/index", {
        products: products
    });

 }  

 // ==========================
// Chi tiết sản phẩm
// ==========================
module.exports.detail = async (req, res) => {

    const product = await Product.findOne({
        slug: req.params.slug,
        deleted: false,
        status: "active"
    });

    if (!product) {
        return res.redirect("/products");
    }

    res.render("client/pages/products/detail", {
        pageTitle: product.name,
        product: product
    });

}