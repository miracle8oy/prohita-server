-- CreateTable
CREATE TABLE "Candidate" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);
