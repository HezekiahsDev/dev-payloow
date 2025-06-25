import express from 'express';
import bills from '../controller/bills';

const router = express.Router();

router.route('/get-bill-details').get(bills.GetBillAccount);
router.route('/buy-data').post(bills.buyData);
router.route('/buy-airtime').post(bills.buyAirTime);
router.route('/buy-electricity').post(bills.buyElectricityBill);
router.route('/airtime-to-cash').post(bills.airTimeToCash);
router.route('/network-fee').post(bills.networkFee);
router.route('/all-networks').get(bills.allNetworks);

export default router;
