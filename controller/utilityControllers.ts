import { PrismaClient } from "@prisma/client";
import express from "express";
import {
  badRequestResponse,
  errorResponse,
  getSuccessResponse,
} from "../utility/httpResponse";
import { sendEmail } from "../utility/emailServices";
const SMTP_USER = process.env.SMPT_USER;

const prisma = new PrismaClient();

export const getEmailData = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const expiredFiles = await prisma.file.findMany({
      where: {
        expiredDate: {
          gte: yesterday,
          lte: today,
        },
      },
      include: {
        Client: true,
      },
    });

    const notification: Array<string> = [];

    expiredFiles.forEach(async (i) => {
      const mailOptions = {
        subject: i.reminderSubject,
        html: i.reminderBody,
        from: SMTP_USER!,
        to: "wijayakusumasandi@gmail.com, undefine",
      };

      await sendEmail(mailOptions)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => console.log(err.message));
    });
    return getSuccessResponse(res, expiredFiles);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getReport = async (
  req: express.Request,
  res: express.Response
) => {
  const { fromDateTime } = req.query;

  if (typeof fromDateTime !== "string") {
    return badRequestResponse(res, "startDateRequired");
  }

  // console.log("FROMDATE", fromDay);

  // const today = new Date();

  // const startDate = new Date(
  //   today.getTime() - 24 * 60 * 60 * 1000 * Number(fromDay)
  // );

  let startDate;

  if (fromDateTime) {
    startDate = new Date(fromDateTime);
  }

  if (!fromDateTime) {
    const today = new Date();

    startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000 * 7);
  }
  try {
    const reports = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });
    return getSuccessResponse(res, reports);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getReportDashboard = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const today = new Date();
    const totalFile = await prisma.file.count();
    const expiredFile = await prisma.file.count({
      where: {
        expiredDate: {
          lte: today,
        },
      },
    });
    const unexpiredFile = await prisma.file.count({
      where: {
        expiredDate: {
          gte: today,
        },
      },
    });
    return getSuccessResponse(res, { totalFile, expiredFile, unexpiredFile });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
