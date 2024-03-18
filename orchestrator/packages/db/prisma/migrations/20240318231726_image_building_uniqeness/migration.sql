/*
  Warnings:

  - You are about to drop the `ImageJobConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ImageJobConfig" DROP CONSTRAINT "ImageJobConfig_imageBuildSHA_fkey";

-- DropTable
DROP TABLE "ImageJobConfig";

-- CreateTable
CREATE TABLE "JobConfigAwaitingImage" (
    "id" SERIAL NOT NULL,
    "jobConfig" JSONB NOT NULL,
    "clientKey" TEXT NOT NULL,
    "clientURL" TEXT NOT NULL,
    "imageBuildSHA" TEXT NOT NULL,

    CONSTRAINT "JobConfigAwaitingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobConfigAwaitingImage_clientKey_clientURL_key" ON "JobConfigAwaitingImage"("clientKey", "clientURL");

-- AddForeignKey
ALTER TABLE "JobConfigAwaitingImage" ADD CONSTRAINT "JobConfigAwaitingImage_imageBuildSHA_fkey" FOREIGN KEY ("imageBuildSHA") REFERENCES "ImageBuildInfo"("dockerfileSHA") ON DELETE RESTRICT ON UPDATE CASCADE;
