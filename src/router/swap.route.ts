import express from 'express';
import { CONFIG } from '../config/index';
import auth from '../authMiddleware/authMiddleware';
import SwapController from '../controller/swap.product';

const router = express.Router();

router.route('/swap/product').post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), SwapController.swapProduct);
router.route('/swap/all').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), SwapController.getSwappedProducts);
router
  .route('/swap/:swapId')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), SwapController.getSingleSwappedProduct);
router
  .route('/swap/delete/:swapId')
  .delete(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), SwapController.deleteSingleSwappedProduct);

export default router;
