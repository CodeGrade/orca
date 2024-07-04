import { Router } from "express";
import { createGraderImage, getImageBuildStatus } from "../controllers/docker-image-controller";

const dockerImagesRouter = Router();

dockerImagesRouter.post("/grader_images", createGraderImage);
dockerImagesRouter.get("/image_build_status/:dockerfileSHA", getImageBuildStatus);

export default dockerImagesRouter;
