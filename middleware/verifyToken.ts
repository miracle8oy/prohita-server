import { PrismaClient } from "@prisma/client";
import express from "express";
import { RolesType } from "../utility/dataInterface";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = "mrc200";

const prisma = new PrismaClient();

const roles: RolesType = {
  admin: 2,
  user: 1,
};

export const verifyAdminToken = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  await handleVerifyUserRole(accessToken, res, next, roles.admin);
};

async function handleVerifyUserRole(
  accessToken: string | undefined,
  res: express.Response,
  next: express.NextFunction,
  roleID: number
) {
  if (!accessToken) {
    return res.status(401).send({
      status: false,
      message: "Unauthorize!",
    });
  }

  jwt.verify(
    accessToken,
    ACCESS_TOKEN_SECRET,
    async (err: any, decode: any) => {
      if (err) {
        return res.status(401).send({
          status: false,
          message: err,
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          email: decode.email,
        },
      });

      if (!user) {
        return res.status(401).send({
          status: false,
          message: "Unauthorize!",
        });
      }

      if (user.roleId !== roleID) {
        return res.status(401).send({
          status: false,
          message: "Access Denied!",
        });
      }

      res.locals.email = user.email;
      res.locals.role = user.roleId;

      next();
    }
  );
}
