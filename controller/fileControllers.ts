import { PrismaClient } from "@prisma/client";
import fs from "fs";
import express from "express";
import {
  badRequestResponse,
  mutationSuccessResponse,
  errorResponse,
  getSuccessResponse,
} from "../utility/httpResponse";

const prisma = new PrismaClient();

export const createFile = async (
  req: express.Request,
  res: express.Response
) => {
  const {
    clientId,
    fileName,
    publishDate,
    expiredDate,
    reminderBody,
    reminderSubject,
    masterId,
  } = req.body;

  try {
    if (
      !clientId ||
      !fileName ||
      !publishDate ||
      !expiredDate ||
      !reminderBody ||
      !reminderSubject ||
      !masterId
    ) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return badRequestResponse(res, "Invalid field request");
    }

    if (!req.file) {
      return badRequestResponse(res, "File required");
    }

    const masterFile = await prisma.master.findUnique({
      where: {
        id: Number(masterId),
      },
    });

    if (!masterFile) {
      return badRequestResponse(res, "Master file id undefine");
    }

    if (req.file.size > masterFile?.maxSize * 1000000) {
      if (!req.file) {
        return badRequestResponse(res, "File required");
      }
      return badRequestResponse(
        res,
        "Maximum file size: " + masterFile.maxSize + "Mb"
      );
    }

    const file = await prisma.file.create({
      data: {
        fileName,
        Client: { connect: { id: Number(clientId) } },
        publishDate,
        expiredDate,
        fileURL: req.file.filename,
        reminderBody,
        reminderSubject,
        Master: { connect: { id: Number(masterId) } },
      },
    });

    await prisma.report.create({
      data: {
        description: `Berhasil menambahkan berkas: ` + fileName,
      },
    });

    return mutationSuccessResponse(res, file);
  } catch (err: any) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    return errorResponse(res, err.message);
  }
};

export const updateFile = async (
  req: express.Request,
  res: express.Response
) => {
  const {
    fileName,
    clientId,
    publishDate,
    expiredDate,
    reminderBody,
    reminderSubject,
    masterId,
  } = req.body;
  const { id } = req.params;

  try {
    if (
      !fileName ||
      !clientId ||
      !publishDate ||
      !expiredDate ||
      !reminderBody ||
      !reminderSubject ||
      !masterId
    ) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return badRequestResponse(res, "Invalid field request");
    }
    if (!req.file) {
      const file = await prisma.file.update({
        data: {
          fileName,
          Client: { connect: { id: Number(clientId) } },
          publishDate,
          expiredDate,
          reminderBody,
          reminderSubject,
          Master: { connect: { id: Number(masterId) } },
        },
        where: {
          id: Number(id),
        },
      });
      await prisma.report.create({
        data: {
          description: `Berhasil mengupdate berkas: ` + fileName,
        },
      });
      return mutationSuccessResponse(res, file);
    }

    if (req.file) {
      const masterFile = await prisma.master.findUnique({
        where: {
          id: Number(masterId),
        },
      });

      if (!masterFile) {
        return badRequestResponse(res, "Master file id undefine");
      }

      if (req.file.size > masterFile?.maxSize * 1000000) {
        if (!req.file) {
          return badRequestResponse(res, "File required");
        }
        return badRequestResponse(
          res,
          "Maximum file size: " + masterFile.maxSize + "Mb"
        );
      }

      const oldFile = await prisma.file.findUnique({
        where: {
          id: Number(id),
        },
      });
      fs.unlinkSync("files\\" + oldFile?.fileURL);
      const file = await prisma.file.update({
        data: {
          fileName,
          Client: { connect: { id: Number(clientId) } },
          publishDate,
          expiredDate,
          fileURL: req.file.filename,
          reminderBody,
          reminderSubject,
          Master: { connect: { id: Number(masterId) } },
        },
        where: {
          id: Number(id),
        },
      });

      await prisma.report.create({
        data: {
          description: `Berhasil mengupdate berkas: ` + fileName,
        },
      });

      return mutationSuccessResponse(res, file);
    }
  } catch (err: any) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    return errorResponse(res, err.message);
  }
};

export const getAllFile = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { keyword, limit, pageNumber, category, status } = req.query;

    const today = new Date();
    if (
      typeof keyword !== "string" ||
      typeof pageNumber !== "string" ||
      typeof limit !== "string" ||
      typeof status !== "string" ||
      typeof category !== "string"
    ) {
      return badRequestResponse(
        res,
        "Keyword, pageNumber, status, category, or limit query undefine"
      );
    }

    let expiredStatus;

    if (status === "true") {
      expiredStatus = {
        gte: today,
      };
    }

    if (status === "false") {
      expiredStatus = {
        lte: today,
      };
    }

    const files = await prisma.file.findMany({
      where: {
        OR: [
          {
            Client: {
              clientName: {
                contains: keyword,
                mode: "insensitive",
              },
            },
          },
          {
            fileName: {
              contains: keyword,
            },
          },
        ],
        expiredDate: expiredStatus,
        Master: {
          name: {
            contains: category,
          },
        },
      },
      orderBy: [
        {
          expiredDate: "desc",
        },
      ],
      include: {
        Client: true,
        Master: true,
      },
      skip: (Number(pageNumber) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalData = await prisma.file.count({
      where: {
        OR: [
          {
            Client: {
              clientName: {
                contains: keyword,
                mode: "insensitive",
              },
            },
          },
          {
            fileName: {
              contains: keyword,
            },
          },
        ],
        expiredDate: expiredStatus,
        Master: {
          name: {
            contains: category,
          },
        },
      },
    });

    return getSuccessResponse(res, files, { totalData });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const deleteFile = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const file = await prisma.file.delete({
      where: {
        id: Number(id),
      },
    });

    fs.unlinkSync("files\\" + file?.fileURL);

    await prisma.report.create({
      data: {
        description: `Berhasil menghapus berkas: ` + file.fileName,
      },
    });

    return getSuccessResponse(res, file);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getSingleFile = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        Master: true,
      },
    });

    return getSuccessResponse(res, file);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
