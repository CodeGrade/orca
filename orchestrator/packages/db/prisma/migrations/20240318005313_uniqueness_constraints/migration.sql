/*
  Warnings:

  - A unique constraint covering the columns `[clientURL,clientKey]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientURL,collationType,collationID]` on the table `Submitter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Job_clientURL_clientKey_key" ON "Job"("clientURL", "clientKey");

-- CreateIndex
CREATE UNIQUE INDEX "Submitter_clientURL_collationType_collationID_key" ON "Submitter"("clientURL", "collationType", "collationID");
