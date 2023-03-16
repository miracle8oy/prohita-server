import { PrismaClient } from "@prisma/client";
import express from "express";
import { RolesType } from "../utility/dataInterface";
import {
  sendEmail,
  resetPasswordEmailTemplate,
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

const ACCESS_TOKEN_SECRET = "mrc200";
const REFRESH_TOKEN_SECRET = "mrc201";
const RESET_PASSWORD_SECRET = "mrc202";
const BASE_URL = "http://localhost:3000";

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

async function createResetToken(email: string) {
  return jwt.sign({ email }, RESET_PASSWORD_SECRET, { expiresIn: 7200 });
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

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   sameSite: "none",
    //   secure: true,
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    return mutationSuccessResponse(res, { accessToken, refreshToken });
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
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return badRequestResponse(res, "User email doesn't exist");
    }

    const resetPasswordURL =
      BASE_URL + "/reset-password/" + (await createResetToken(user.email));

    const tempate = resetPasswordEmailTemplate("Mirace Corp", resetPasswordURL);
    const mailOptions = {
      from: "testing@ittsuexpo.com",
      to: "miracle8oys@gmail.com",
      subject: "This email sent from server",
      html: tempate,
    };

    await sendEmail(mailOptions);

    res.end();
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const resetPassword = async (
  req: express.Request,
  res: express.Response
) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  try {
    if (!newPassword) {
      return badRequestResponse(res, "New password field required");
    }

    jwt.verify(
      resetToken,
      RESET_PASSWORD_SECRET,
      async (err: any, decode: any) => {
        if (err) {
          return badRequestResponse(res, err.message);
        }

        const encryptedPassword = await bcrypt.hash(newPassword, 11);

        const user = await prisma.user.update({
          where: {
            email: decode.email,
          },
          data: {
            password: encryptedPassword,
          },
        });

        return mutationSuccessResponse(
          res,
          "Successfully update password for " + user.email
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
