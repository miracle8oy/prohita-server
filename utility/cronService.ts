import schedule from "node-schedule";
import { PrismaClient } from "@prisma/client";
import { EmailType } from "../utility/dataInterface";
import { sendEmail } from "./emailServices";
const SMTP_USER = process.env.SMPT_USER;
const STATUS = process.env.STATUS;

const prisma = new PrismaClient();

function emailCron() {
  schedule.scheduleJob("7 * * *", async function () {
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

    expiredFiles.forEach(async (i) => {
      const mailOptions: EmailType = {
        subject: i.reminderSubject,
        html: i.reminderBody,
        from: SMTP_USER!,
        to: `${i.Client!.firstEmail}, ${i.Client!.secondEmail}`,
      };

      await sendEmail(mailOptions)
        .then(async () => {
          await prisma.report.create({
            data: {
              description: `Berhasil mengirim notifikasi kepada ${i.Client?.clientName}`,
            },
          });
        })
        .catch((err) => console.log(err.message));
    });
  });
}

function testingEmailCron() {
  schedule.scheduleJob("*/20 * * * *", async function () {
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

    expiredFiles.forEach(async (i) => {
      const mailOptions: EmailType = {
        subject: i.reminderSubject,
        html: i.reminderBody,
        from: SMTP_USER!,
        to: `${i.Client!.firstEmail}, ${i.Client!.secondEmail}`,
      };

      await sendEmail(mailOptions)
        .then(async () => {
          await prisma.report.create({
            data: {
              description: `Berhasil mengirim notifikasi kepada ${i.Client?.clientName}`,
            },
          });
        })
        .catch((err) => console.log(err.message));
    });
  });
}

export default STATUS === "development" ? testingEmailCron : emailCron;
