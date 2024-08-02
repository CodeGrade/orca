import { Router } from "express";
import { createGraderImage, getImageBuildStatus } from "../controllers/docker-image-controller";
import verifyAPIKey from "../middleware/verify-api-key";

const dockerImagesRouter = Router();

dockerImagesRouter.post("/grader_images", verifyAPIKey, createGraderImage);
dockerImagesRouter.get("/grader_images/status/:dockerfileSHA", getImageBuildStatus);

export default dockerImagesRouter;
