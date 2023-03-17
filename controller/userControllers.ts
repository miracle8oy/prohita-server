import { PrismaClient } from "@prisma/client";
import express from "express";
import { RolesType } from "../utility/dataInterface";
import {
  resetPasswordEmailTemplate,
  sendEmail,
} from "../utility/emailServices";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  badRequestResponse,
  errorResponse,
  getSuccessResponse,
  loginRedirectResponse,
  mutationSuccessResponse,
} from "../utility/httpResponse";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL!;
const SMTP_USER = process.env.SMPT_USER!;
const RECOVERY_EMAIL = process.env.RECOVERY_EMAIL!;

const prisma = new PrismaClient();

const roles: RolesType = {
  user: 1,
  admin: 2,
};

async function createAccesToken(email: string) {
  return jwt.sign({ email }, ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
}

async function createRefreshToken(email: string) {
  return jwt.sign(
    {
      email,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}

export const createUser = async (
  req: express.Request,
  res: express.Response
) => {
  const { name, email, password, roleId } = req.body;

  if (!email || !password) {
    return badRequestResponse(res, "Email and password required");
  }

  const encryptedPassword = await bcrypt.hash(password, 11);

  try {
    if (roleId === roles.user || roleId === roles.admin) {
      await prisma.user.create({
        data: {
          name,
          email,
          password: encryptedPassword,
          roleId,
        },
      });

      return mutationSuccessResponse(res, "Register Success");
    } else {
      return badRequestResponse(res, "User role undefine");
    }
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    const userData = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!userData) {
      return badRequestResponse(res, "Email undefine");
    }

    const checkPassword = await bcrypt.compare(password, userData.password);

    if (!checkPassword) {
      return badRequestResponse(res, "Invalide password");
    }

    const accessToken = await createAccesToken(userData.email);
    const refreshToken = await createRefreshToken(userData.email);

    return mutationSuccessResponse(res, {
      accessToken,
      refreshToken,
      name: userData.name,
    });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const refresh = async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return loginRedirectResponse(res);
    }

    jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET,
      async (err: any, decode: any) => {
        if (err) {
          return loginRedirectResponse(res);
        }

        const user = await prisma.user.findUnique({
          where: {
            email: decode.email,
          },
        });

        if (!user) {
          return loginRedirectResponse(res);
        }

        const accessToken = await createAccesToken(user.email);

        return mutationSuccessResponse(res, { accessToken });
      }
    );
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const sendResetPassword = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const accessToken = (await createAccesToken(RECOVERY_EMAIL))
      .replace(".", "DOT")
      .replace(".", "DOT");
    const resetPasswordURL =
      FRONTEND_BASE_URL + "/reset-password/" + accessToken;

    const emailBody = resetPasswordEmailTemplate("Prohita", resetPasswordURL);

    const mailOptions = {
      from: SMTP_USER!,
      to: RECOVERY_EMAIL!,
      subject: "RESET PASSWORD",
      html: emailBody,
    };

    await sendEmail(mailOptions);

    return mutationSuccessResponse(
      res,
      "Reset password url successfully send to recovery email"
    );
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const resetPassword = async (
  req: express.Request,
  res: express.Response
) => {
  const { resetToken } = req.params;
  const { newEmail, newPassword } = req.body;
  try {
    if (!newPassword || !newEmail) {
      return badRequestResponse(res, "New password field required");
    }
    const accessToken = resetToken.replace("DOT", ".").replace("DOT", ".");
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

        const encryptedPassword = await bcrypt.hash(newPassword, 11);
        const user = await prisma.user.create({
          data: {
            email: newEmail,
            password: encryptedPassword,
            name: "ADMIN",
            roleId: roles.admin,
          },
        });

        return mutationSuccessResponse(
          res,
          "Successfully create account for " + user.email
        );
      }
    );
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getAllUsers = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await prisma.user.findMany();
    return getSuccessResponse(res, users);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
