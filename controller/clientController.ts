import { PrismaClient } from "@prisma/client";
import express from "express";
import {
  badRequestResponse,
  mutationSuccessResponse,
  errorResponse,
  getSuccessResponse,
} from "../utility/httpResponse";

const prisma = new PrismaClient();

export const createClient = async (
  req: express.Request,
  res: express.Response
) => {
  const {
    clientName,
    firstEmail,
    secondEmail,
    firstPhone,
    secondPhone,
    address,
    businessType,
  } = req.body;

  try {
    if (
      !clientName ||
      !firstEmail ||
      !firstPhone ||
      !address ||
      !businessType
    ) {
      return badRequestResponse(res, "All fields required");
    }

    const masterClient = await prisma.client.create({
      data: {
        clientName,
        firstEmail,
        firstPhone,
        secondEmail,
        secondPhone,
        address,
        businessType,
      },
    });

    await prisma.report.create({
      data: {
        description: `Berhasil menambahkan klien baru`,
      },
    });

    return mutationSuccessResponse(res, masterClient);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const updateMasterClient = async (
  req: express.Request,
  res: express.Response
) => {
  const {
    clientName,
    firstEmail,
    secondEmail,
    firstPhone,
    secondPhone,
    address,
    businessType,
    status,
  } = req.body;
  const { id } = req.params;

  try {
    const masterClient = await prisma.client.update({
      where: {
        id: Number(id),
      },
      data: {
        clientName,
        firstEmail,
        secondEmail,
        firstPhone,
        secondPhone,
        address,
        businessType,
        status,
      },
    });

    await prisma.report.create({
      data: {
        description: `Berhasil mengupdate data klien: ` + clientName,
      },
    });

    return mutationSuccessResponse(res, masterClient);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getAllMasterClient = async (
  req: express.Request,
  res: express.Response
) => {
  const { status, keyword, limit } = req.query;
  try {
    if (typeof keyword !== "string") {
      return badRequestResponse(res, "Keyword query undefine");
    }

    let masterClientStatus;

    if (status === "true") {
      masterClientStatus = true;
    }

    if (status === "false") {
      masterClientStatus = false;
    }

    const masterClients = await prisma.client.findMany({
      where: {
        status: masterClientStatus,
        clientName: {
          contains: keyword,
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      take: Number(limit),
    });
    return getSuccessResponse(res, masterClients);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getSingleMasterClient = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const masterClient = await prisma.client.findUnique({
      where: {
        id: Number(id),
      },
    });
    return getSuccessResponse(res, masterClient);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
