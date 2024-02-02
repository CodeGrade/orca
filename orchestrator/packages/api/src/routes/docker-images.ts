import { Router } from "express";
import { createGraderImage } from "../controllers/docker-image-controller";

const dockerImagesRouter = Router();

dockerImagesRouter.post("/grader_images", createGraderImage);

export default dockerImagesRouter;
