import express from 'express';
import { CONFIG } from '../config/index';
import auth from '../authMiddleware/authMiddleware';
import easybuyInventory from '../controller/easybuy.inventory';
import EasyBuyController from '../controller/easybuy.controller';
import { easyBuyCreateProductImageUpload } from '../libraries/multer';

const router = express.Router();

router
  .route('/easybuy/profile')
  .post(auth(), EasyBuyController.createEasyBuyProfile);

router
  .route('/easybuy/buyer/delivery-information')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getBuyerDeliveryInformation);

router
  .route('/easybuy/categories')
  .post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.createEasyBuyCategories);
router
  .route('/easybuy/categories')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getEasyBuyCategories);

router.route('/easybuy/coupon').post(auth([CONFIG.ROLES.SUPERADMIN]), EasyBuyController.createEasyBuyCoupon);

router.route('/easybuy/coupon').get(auth([CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getEasyBuyCoupons);

router.route('/easybuy/transactions').get(auth(CONFIG.ROLES.USER), EasyBuyController.getAllUserEasyBuyTransactions);

router
  .route('/easybuy/buyer/products')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getAllProducts);

router
  .route('/easybuy/buyer/check-coupon')
  .post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.checkCoupon);

router
  .route('/easybuy/buyer/cart')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getCartItems);

router
  .route('/easybuy/buyer/cart')
  .post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.addEasyBuyProductToCart);

router
  .route('/easybuy/buyer/cart')
  .delete(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.removeEasyBuyProductFromCart);

router
  .route('/easybuy/buyer/checkout')
  .post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.checkOut);

router
  .route('/easybuy/buyer/orders')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getOrders);

router.route('/easybuy/buyer/orders/delete').delete(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.deleteAllProductInCart);

router
  .route('/easybuy/buyer/installment-orders')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getEasyBuyInstallmentOrders);

router.route('/easybuy/partner/products').post(auth(), easyBuyCreateProductImageUpload, EasyBuyController.createEasyBuyProduct);

router
  .route('/easybuy/partner/products')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getEasyBuyProductsForPartner);

router
  .route('/easybuy/partner/products/:productId')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getEasyBuyProductForPartner);

router
  .route('/easybuy/partner/inventory/products/') 
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), easybuyInventory.getProductInventory);

router.route('/easybuy/partner/inventory/orders').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), easybuyInventory.getOrderInventory);

router
  .route('/easybuy/partner/inventory/orders/:orderId')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), easybuyInventory.getSingleUserInventory);

router
  .route('/easybuy/partner/inventory/solar-inverter-stock')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), easybuyInventory.NumberOfSolarAndInverterAndStockPreview);

router.route('/easybuy/partner/inventory/percentage-paid').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), easybuyInventory.GetPercentageOfInstallmentOrdersPaid);

router
  .route('/easybuy/partner/inventory/number-of-active-customers')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), easybuyInventory.numberOfActiveCustomers);

router
  .route('/easybuy/partner/service-center')
  .post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.createServiceCenter);

router
  .route('/easybuy/partner/service-center')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getServiceCenters);

router
  .route('/easybuy/partner/customers')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.SUPERADMIN]), EasyBuyController.getCustomers);

export default router;
