-- CreateEnum
CREATE TYPE "CollationType" AS ENUM ('USER', 'TEAM');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "releaseAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitterID" INTEGER,
    "jobID" INTEGER,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submitter" (
    "id" SERIAL NOT NULL,
    "clientURL" TEXT NOT NULL,
    "collationType" "CollationType" NOT NULL,
    "collationID" TEXT NOT NULL,

    CONSTRAINT "Submitter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "clientURL" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submitterID" INTEGER,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageBuildInfo" (
    "dockerfileSHA" TEXT NOT NULL,
    "dockerfileContent" TEXT NOT NULL,

    CONSTRAINT "ImageBuildInfo_pkey" PRIMARY KEY ("dockerfileSHA")
);

-- CreateTable
CREATE TABLE "ImageJobConfig" (
    "id" SERIAL NOT NULL,
    "jobConfig" JSONB NOT NULL,
    "imageBuildSHA" TEXT NOT NULL,

    CONSTRAINT "ImageJobConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_jobID_key" ON "Reservation"("jobID");

-- CreateIndex
CREATE UNIQUE INDEX "ImageJobConfig_jobConfig_key" ON "ImageJobConfig"("jobConfig");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_submitterID_fkey" FOREIGN KEY ("submitterID") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_jobID_fkey" FOREIGN KEY ("jobID") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_submitterID_fkey" FOREIGN KEY ("submitterID") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageJobConfig" ADD CONSTRAINT "ImageJobConfig_imageBuildSHA_fkey" FOREIGN KEY ("imageBuildSHA") REFERENCES "ImageBuildInfo"("dockerfileSHA") ON DELETE RESTRICT ON UPDATE CASCADE;
