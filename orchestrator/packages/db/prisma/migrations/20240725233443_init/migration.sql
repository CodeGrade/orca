-- CreateEnum
CREATE TYPE "CollationType" AS ENUM ('USER', 'TEAM');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitterID" INTEGER,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageBuildInfo" (
    "dockerfileSHA" TEXT NOT NULL,
    "dockerfileContent" TEXT NOT NULL,
    "responseURL" TEXT NOT NULL,
    "inProgress" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageBuildInfo_pkey" PRIMARY KEY ("dockerfileSHA")
);

-- CreateTable
CREATE TABLE "JobConfigAwaitingImage" (
    "id" SERIAL NOT NULL,
    "jobConfig" JSONB NOT NULL,
    "clientKey" TEXT NOT NULL,
    "clientURL" TEXT NOT NULL,
    "isImmediate" BOOLEAN NOT NULL DEFAULT false,
    "imageBuildSHA" TEXT NOT NULL,

    CONSTRAINT "JobConfigAwaitingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_jobID_key" ON "Reservation"("jobID");

-- CreateIndex
CREATE UNIQUE INDEX "Submitter_clientURL_collationType_collationID_key" ON "Submitter"("clientURL", "collationType", "collationID");

-- CreateIndex
CREATE UNIQUE INDEX "Job_clientURL_clientKey_key" ON "Job"("clientURL", "clientKey");

-- CreateIndex
CREATE UNIQUE INDEX "JobConfigAwaitingImage_clientKey_clientURL_key" ON "JobConfigAwaitingImage"("clientKey", "clientURL");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_submitterID_fkey" FOREIGN KEY ("submitterID") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_jobID_fkey" FOREIGN KEY ("jobID") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_submitterID_fkey" FOREIGN KEY ("submitterID") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobConfigAwaitingImage" ADD CONSTRAINT "JobConfigAwaitingImage_imageBuildSHA_fkey" FOREIGN KEY ("imageBuildSHA") REFERENCES "ImageBuildInfo"("dockerfileSHA") ON DELETE CASCADE ON UPDATE CASCADE;
