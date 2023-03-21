import userRoute from "./userRoutes";
import utilityRoute from "./utilityRoutes";
import masterRoute from "./masterFileRoutes";
import fileRoute from "./fileRutes";
import clientRoute from "./clientRoutes";
import express from "express";

function route(app: express.Application) {
  app.use(userRoute);
  app.use(utilityRoute);
  app.use(masterRoute);
  app.use(fileRoute);
  app.use(clientRoute);
}

export default route;
