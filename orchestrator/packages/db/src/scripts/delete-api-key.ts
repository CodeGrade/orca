import { parseArgs } from "util";
import prismaInstance from "../prisma-instance";

const main = async () => {
  const { values } = parseArgs(
    {
      options:
      {
        hostname: { type: "string", short: "h" },
        key: { type: "string", short: "k" }
      },
    }
  );
  const missing = Object.entries(values).filter(([_, v]) => v === undefined).map(([k, _]) => k);
  if (missing.length) {
    process.stderr.write(`Missing the following options: ${missing.join(', ')}`);
    process.exit(1);
  }
  const { hostname, key } = values;
  const deletedResult = await prismaInstance.$transaction(async (tx) => await tx.apiKey.deleteMany(
    { where: { hostname, value: key } }
  ));
  const { count } = deletedResult;
  if (!count) {
    process.stderr.write("The given key does not exist under the given host name.");
    process.exit(1);
  }
};

main();
