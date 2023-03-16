import { PrismaClient } from "@prisma/client";
import express from "express";
import {
  badRequestResponse,
  mutationSuccessResponse,
  errorResponse,
  getSuccessResponse,
} from "../utility/httpResponse";

const prisma = new PrismaClient();

export const createMasterFile = async (
  req: express.Request,
  res: express.Response
) => {
  const { name, maxSize } = req.body;

  try {
    if (!name || !maxSize) {
      return badRequestResponse(res, "Name and mazSize field required");
    }

    const masterFile = await prisma.master.create({
      data: {
        name,
        maxSize,
      },
    });

    await prisma.report.create({
      data: {
        description: `Berhasil menambahkan jenis berkas baru`,
      },
    });

    return mutationSuccessResponse(res, masterFile);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const updateMasterFile = async (
  req: express.Request,
  res: express.Response
) => {
  const { name, maxSize, status } = req.body;
  const { id } = req.params;

  try {
    const masterFile = await prisma.master.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        maxSize,
        status,
      },
    });

    console.log("UPDATED");

    await prisma.report.create({
      data: {
        description: `Berhasil mengupdate jenis berkas: ` + name,
      },
    });

    return mutationSuccessResponse(res, masterFile);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getAllMasterFile = async (
  req: express.Request,
  res: express.Response
) => {
  const { status, keyword, limit } = req.query;
  try {
    if (typeof keyword !== "string") {
      return badRequestResponse(res, "Keyword query undefine");
    }
    if (status === "true") {
      const masterFiles = await prisma.master.findMany({
        where: {
          status: true,
          name: {
            contains: keyword,
          },
        },
        take: Number(limit),
      });
      return getSuccessResponse(res, masterFiles);
    } else {
      const masterFiles = await prisma.master.findMany({
        where: {
          name: {
            contains: keyword,
          },
        },
        take: Number(limit),
      });
      return getSuccessResponse(res, masterFiles);
    }
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getSingleMasterFile = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const masterFiles = await prisma.master.findUnique({
      where: {
        id: Number(id),
      },
    });
    return getSuccessResponse(res, masterFiles);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
