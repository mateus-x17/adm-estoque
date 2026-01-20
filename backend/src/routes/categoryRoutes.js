import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { createCategory, listCategories, updateCategory, deleteCategory, countCategories } from "../controllers/categoryController.js";

const router = express.Router();
router.use(authMiddleware);

// count above list to avoid collision
router.get("/count", countCategories);
router.get("/", listCategories);
router.post("/", permit("ADMIN", "GERENTE"), createCategory);
router.put("/:id", permit("ADMIN", "GERENTE"), updateCategory);
router.delete("/:id", permit("ADMIN"), deleteCategory);

export default router;
