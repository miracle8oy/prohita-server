import express from "express";
import routes from "./router";
import morgan from "morgan";
import cors from "cors";
import emailCron from "./utility/cronService";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("files"));

routes(app);

emailCron();

app.listen(PORT, () =>
  console.log(
    `
🚀 Server ready at: PORT:` + PORT
  )
);
