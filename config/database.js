const mongoose = require("mongoose");

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("Ket noi MongoDB thanh cong!"); 

    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
    console.log("Port:", mongoose.connection.port);
  } catch (error) {
    console.log("Ket noi that bai!");
  }
}; 
