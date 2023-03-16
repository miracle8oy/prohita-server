import schedule from "node-schedule";
import { PrismaClient } from "@prisma/client";
import { EmailType } from "../utility/dataInterface";
import { sendEmail } from "./emailServices";
const SMTP_USER = process.env.SMPT_USER;
const STATUS = process.env.STATUS;

const prisma = new PrismaClient();

function emailCron() {
  schedule.scheduleJob("7 * * *", async function () {
    const today = new Date().toISOString().split("T")[0];
    const isoDate = new Date(today).toISOString();

    const expiredFiles = await prisma.file.findMany({
      where: {
        expiredDate: isoDate,
      },
    });

    expiredFiles.forEach(async (i) => {
      const mailOptions: EmailType = {
        subject: i.reminderSubject,
        html: i.reminderBody,
        from: SMTP_USER!,
        to: i.email,
      };

      await sendEmail(mailOptions)
        .then(async () => {
          await prisma.report.create({
            data: {
              description: `Berhasil mengirim notifikasi kepada ${i.email}`,
            },
          });
        })
        .catch((err) => console.log(err.message));
    });
  });
}

function testingEmailCron() {
  schedule.scheduleJob("*/10 * * * *", async function () {
    const today = new Date().toISOString().split("T")[0];
    const isoDate = new Date(today).toISOString();

    const expiredFiles = await prisma.file.findMany({
      where: {
        expiredDate: isoDate,
      },
    });

    expiredFiles.forEach(async (i) => {
      const mailOptions: EmailType = {
        subject: i.reminderSubject,
        html: i.reminderBody,
        from: SMTP_USER!,
        to: i.email,
      };

      await sendEmail(mailOptions)
        .then(async () => {
          await prisma.report.create({
            data: {
              description: `Berhasil mengirim notifikasi kepada ${i.email}`,
            },
          });
        })
        .catch((err) => console.log(err.message));
    });
  });
}

export default STATUS === "development" ? testingEmailCron : emailCron;
