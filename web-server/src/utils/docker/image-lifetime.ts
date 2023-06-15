import { spawn } from "child_process";
import path from "path";

export const touchImage = (imageSHA: string) => {
  spawn("touch", [path.join(__dirname, "files/images", `${imageSHA}.tgz`)]);
};

// TODO: Write automation for finding all images not used in the last week
// and remove them.
export const cleanUpUnusedImages = () => {};
