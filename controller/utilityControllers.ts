import { PrismaClient } from "@prisma/client";
import express from "express";
import {
  badRequestResponse,
  mutationSuccessResponse,
  errorResponse,
  getSuccessResponse,
} from "../utility/httpResponse";
import { sendEmail } from "../utility/emailServices";
const SMTP_USER = process.env.SMPT_USER;

const prisma = new PrismaClient();

export const createCandidate = async (
  req: express.Request,
  res: express.Response
) => {
  const { name, email, description } = req.body;

  try {
    if (!name || !email) {
      return badRequestResponse(res, "Name and email field required");
    }

    const candidate = await prisma.candidate.create({
      data: {
        description,
        email,
        name,
      },
    });

    return mutationSuccessResponse(res, candidate);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getAllCandidate = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const candidates = await prisma.candidate.findMany();
    return getSuccessResponse(res, candidates);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getfileDocument = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const candidates = await prisma.candidate.findMany();
    return getSuccessResponse(res, candidates);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getEmailData = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const isoDate = new Date(today).toISOString();

    const expiredFiles = await prisma.file.findMany({
      where: {
        expiredDate: isoDate,
      },
    });

    const notification: Array<string> = [];

    expiredFiles.forEach(async (i) => {
      const mailOptions = {
        subject: i.reminderSubject,
        html: i.reminderBody,
        from: SMTP_USER!,
        to: i.email,
      };

      await sendEmail(mailOptions)
        .then(() => {
          notification.push(
            "Berhasil mengirim notifikasi kepada: " +
              i.clientName +
              " pada: " +
              today
          );
        })
        .catch((err) => console.log(err.message));
    });
    res.end();
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getReport = async (
  req: express.Request,
  res: express.Response
) => {
  const { fromDay } = req.query;
  const today = new Date();
  const startDate = new Date(
    today.getTime() - 24 * 60 * 60 * 1000 * Number(fromDay)
  );
  try {
    const yesterday = (new Date().getDate() - 1).toLocaleString;
    const reports = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
    return getSuccessResponse(res, reports);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
