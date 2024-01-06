import { Router } from "express";
import {
  cleanUpUnusedGraderImages,
  createGraderImage,
} from "../controllers/docker-image-controller";

const dockerImagesRouter = Router();

dockerImagesRouter.post("/grader_images", createGraderImage);
dockerImagesRouter.delete("/grader_images", cleanUpUnusedGraderImages);

export default dockerImagesRouter;
