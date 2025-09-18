import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { createCategory, listCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", listCategories);
router.post("/", permit("ADMIN","GERENTE"), createCategory);
router.put("/:id", permit("ADMIN","GERENTE"), updateCategory);
router.delete("/:id", permit("ADMIN"), deleteCategory);

export default router;
