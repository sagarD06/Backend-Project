import dotenv from "dotenv";
import connectDB from "./database/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    const portNumber = process.env.PORT || 8000;
    app.on("error", (error) => {
      console.log(`Error : ${error}`);
    });
    app.listen(portNumber, () => {
      console.log(`⚙ Server is running on http://localhost:${portNumber}`);
    });
  })
  .catch((err) => {
    console.log(`Database connection error ${err.message}`);
    process.exit(1);
  });
