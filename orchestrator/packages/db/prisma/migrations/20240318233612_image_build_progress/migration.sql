/*
  Warnings:

  - Added the required column `inProgress` to the `ImageBuildInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageBuildInfo" ADD COLUMN     "inProgress" BOOLEAN NOT NULL;
