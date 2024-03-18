/**
 * According to the Prisma documentation, long-running applications
 * should only utilized one instance of the prisma client for all operations.
 * See this link for more information;
 * https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prismaclient-in-long-running-applications
**/
import { PrismaClient } from "@prisma/client";

const prismaInstance = new PrismaClient();
export default prismaInstance;
