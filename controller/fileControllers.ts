import { PrismaClient } from "@prisma/client";
import fs from "fs";
import express from "express";
import {
  badRequestResponse,
  mutationSuccessResponse,
  errorResponse,
  getSuccessResponse,
} from "../utility/httpResponse";
import { ParsedUrlQuery } from "querystring";

const prisma = new PrismaClient();

export const createFile = async (
  req: express.Request,
  res: express.Response
) => {
  const {
    clientName,
    address,
    email,
    phone,
    publishDate,
    expiredDate,
    reminderBody,
    reminderSubject,
    masterId,
  } = req.body;

  try {
    if (
      !clientName ||
      !email ||
      !address ||
      !phone ||
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
        clientName,
        address,
        email,
        phone,
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
        description: `Berhasil menambahkan berkas: ` + clientName,
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
    clientName,
    address,
    email,
    phone,
    publishDate,
    expiredDate,
    reminderBody,
    reminderSubject,
    masterId,
  } = req.body;
  const { id } = req.params;

  try {
    if (
      !clientName ||
      !email ||
      !address ||
      !phone ||
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
          clientName,
          address,
          email,
          phone,
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
          description: `Berhasil mengupdate berkas: ` + clientName,
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
          clientName,
          address,
          email,
          phone,
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
          description: `Berhasil mengupdate berkas: ` + clientName,
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
    const { keyword, limit, pageNumber, category } = req.query;
    if (
      typeof keyword !== "string" ||
      typeof pageNumber !== "string" ||
      typeof limit !== "string"
    ) {
      return badRequestResponse(
        res,
        "Keyword, pageNumber or limit query undefine"
      );
    }

    let files: any = [];

    if (!category) {
      files = await searchWithoutCategory(keyword, pageNumber, limit);
    }
    if (category) {
      files = await searchWithCategory(
        keyword,
        pageNumber,
        limit,
        category,
        res
      );
    }
    const totalData = await prisma.file.count({
      where: {
        clientName: {
          contains: keyword,
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
        description: `Berhasil menghapus berkas: ` + file.clientName,
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

async function searchWithoutCategory(
  keyword: string,
  pageNumber: string,
  limit: string
) {
  const files = await prisma.file.findMany({
    where: {
      OR: [
        {
          clientName: {
            contains: keyword,
          },
        },
        {
          email: {
            contains: keyword,
          },
        },
      ],
    },
    skip: (Number(pageNumber) - 1) * Number(limit),
    take: Number(limit),
    include: {
      Master: true,
    },
  });

  return files;
}

async function searchWithCategory(
  keyword: string,
  pageNumber: string,
  limit: string,
  category: any,
  res: express.Response
) {
  if (typeof category !== "string") {
    return badRequestResponse(res, "Category type undefine");
  }
  const files = await prisma.file.findMany({
    where: {
      OR: [
        {
          clientName: {
            contains: keyword,
          },
          Master: {
            name: category,
          },
        },
        {
          email: {
            contains: keyword,
          },
          Master: {
            name: category,
          },
        },
      ],
    },
    skip: (Number(pageNumber) - 1) * Number(limit),
    take: Number(limit),
    include: {
      Master: true,
    },
  });

  return files;
}
