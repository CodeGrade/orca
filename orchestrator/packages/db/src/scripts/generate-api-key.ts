import { parseArgs } from "util";
import { createAPIKey } from "../api-key-operations";

const main = async () => {
  const { values } = parseArgs({ options: { hostname: { type: "string", short: "h" } } });
  const { hostname } = values;
  if (!hostname) {
    console.error("Must provide hostname for api key generation with flag '-h'.");
    process.exit(1);
  }
  await createAPIKey(hostname as string);
}

main();
