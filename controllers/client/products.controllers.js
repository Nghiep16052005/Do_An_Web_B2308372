const Product = require("../../models/product.model");

module.exports.index = async (req, res) => {
    console.log("Da vao controller");
    // const Products = mongoose.model("Product", productSchema, "products");
    // const product = new Product({"_id": "648c9e5b1c4a3e6d8c8b4567", 
    //     "name": "Laptop Asus ROG Zephyrus G14 GA401QE-HE003T", 
    //     "category": "laptop", 
    //     "priceIn": 20000000, 
    //     "priceOut": 25000000, 
    //     "salePrice": 22000000, 
    //     "stock": 10, 
    //     "sold": 5, 
    //     "status": "active", 
    //     "thumbnail": "https://product.hstatic.net/200000033444/product/ga401qe_he003t_1_9f0a2e7c8b654d9dbf0e5a1c3e6f1b.jpg", "images": ["https://product.hstatic.net/200000033444/product/ga401qe_he003t_1_9f0a2e7c8b654d9dbf0e5a1c3e6f1b.jpg", 
    //         "https://product.hstatic.net/200000033444/product/ga401qe_he003t_2_4d8b6a7c8b654d9dbf0e5a1c3e6f1b.jpg"], 
    //         "specifications": {"cpu": {"brand": "AMD", "model": "Ryzen 9 4900HS"}, "ram": {"size": 16, "type": "DDR4"}, "gpu": {"brand": "NVIDIA", "model": "GeForce RTX 2060"}, "storage": {"type": "SSD", "capacity": "512GB"}, "display": {"size": "14 inch", "refreshRate": "120Hz"}, "os": "Windows 10"}, "description": "", "__v": 0});
    //         console.log("da tao doi tuong product: ", product);
    //         const savedProduct = await product.save();
    const products = await Product.find({
        status: "active"
    });  

    console.log("===================================")
    
   console.log(products[0]); 
    res.render("client/pages/products/index", {
        products: products
    });

 }  
// test controller
// module.exports.index = async (req, res) => {

//     res.send("Controller OK");

// } 

// kiem tra database
// const Product = require("../../models/product.model");

// module.exports.index = async (req, res) => {

//     const products = await Product.find({});

//     res.send(products);

// } 
