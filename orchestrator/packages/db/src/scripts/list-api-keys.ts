import { parseArgs } from "util";
import prismaInstance from "../prisma-instance";

const main = async () => {
  const { values } = parseArgs({ options: { hostname: { type: "string", short: "h" } } });
  const { hostname } = values;
  if (!hostname) {
    process.stderr.write("Must provide hostname option.");
    process.exit(1);
  }
  const keys = await prismaInstance.apiKey.findMany({ where: { hostname } }).then((vals) => vals.map((v) => v.value));
  if (!keys.length) {
    process.stderr.write("No keys found under given host name.");
    process.exit(0);
  }
  process.stdout.write(keys.join("\n") + "\n");
};

main();
