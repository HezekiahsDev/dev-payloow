import joi from 'joi';
import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import customError from '../../utils/custom.errors';
import userSchema, { EasyBuyRole } from '../../models/user.schema';
import easybuy_ordersSchema from '../../models/easybuy_orders.schema';
import easybuy_productsSchema from '../../models/easybuy_products.schema';

class InventoryManagementService {
  async ProductInventory(req: AuthRequest) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const skip = (page - 1) * limit;
    try {
      const product = await easybuy_productsSchema
        .find({ partner: req.user?._id })
        .populate('category')
        .select('-color -isFeatured -additionalImageKeys')
        .limit(limit)
        .skip(skip);

      if (!product) throw new customError('No product found', StatusCodes.NOT_FOUND);

      const user = await userSchema.findById(req.user?._id);

      if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
        throw new customError("You're not an EasyBuy Partner", StatusCodes.BAD_REQUEST);

      return {
        statusCode: StatusCodes.OK,
        message: 'Product Inventory',
        data: product,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async OrderInventory(req: AuthRequest) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const skip = (page - 1) * limit;

    try {
      const OrderInventory = await easybuy_ordersSchema
        .find({
          'cartItems.partner': req.user?._id,
        })
        .limit(limit)
        .skip(skip);

      const user = await userSchema.findById(req.user?._id);

      if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
        throw new customError("You're not an EasyBuy Partner", StatusCodes.BAD_REQUEST);

      if (!OrderInventory || OrderInventory.length === 0)
        throw new customError('No orders found for this partner', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Order Inventory',
        data: OrderInventory,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getSingleUserInventory(req: AuthRequest) {
    const { error, value: data } = joi
      .object({
        orderId: joi.string().required(),
      })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
        throw new customError("You're not an EasyBuy Partner", StatusCodes.BAD_REQUEST);

      const foundOrders = await easybuy_ordersSchema.findOne({ orderId: data.orderId });

      if (!foundOrders) throw new customError('Order not found', StatusCodes.NOT_FOUND);

      return foundOrders;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getNumberOfSolarAndPhonesAndStocks(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
        throw new customError("You're not an EasyBuy Partner", StatusCodes.BAD_REQUEST);
      const products = await easybuy_productsSchema.aggregate([
        {
          $match: {
            partner: req.user?._id,
          },
        },
        {
          $lookup: {
            from: 'easybuycategories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category', // this would convert the easybuy category array to an object
        },
        {
          $facet: {
            categories: [
              {
                $match: {
                  'category.name': { $in: ['Solar Panel', 'Phones'] },
                },
              },
              {
                $group: {
                  _id: '$category.name',
                  count: { $sum: 1 },
                  totalStock: { $sum: '$stock' },
                },
              },
            ],
            totalStock: [
              {
                $group: {
                  _id: null,
                  totalStock: { $sum: '$stock' },
                },
              },
            ],
          },
        },
      ]);

      if (!products || products.length === 0) throw new customError('No product found', StatusCodes.NOT_FOUND);

      return products;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async numberOfActiveCustomers(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
        throw new customError("You're not an EasyBuy Partner", StatusCodes.BAD_REQUEST);

      const customers = await easybuy_ordersSchema.aggregate([
        {
          $group: {
            _id: '$user',
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);

      if (!customers || customers.length === 0) throw new customError('No customer found', StatusCodes.NOT_FOUND);

      return customers;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getPercentageOfInstallmentOrdersPaid(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
        throw new customError("You're not an EasyBuy Partner", StatusCodes.BAD_REQUEST);

      const installmentOrders = await easybuy_ordersSchema.aggregate([
        {
          $match: {
            'installmentDetails.isInstallment': true,
          },
        },
        {
          $project: {
            totalInstallment: { $size: '$installmentDetails.installments' },
            paidInstallment: {
              $size: {
                $filter: {
                  input: '$installmentDetails.installments',
                  as: 'installment',
                  cond: { $ne: ['$$installment.paymentDate', null] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalInstallment: { $sum: '$totalInstallment' },
            paidInstallment: { $sum: '$paidInstallment' },
          },
        },
        {
          $project: {
            percentagePaid: { $multiply: [{ $divide: ['$paidInstallment', '$totalInstallment'] }, 100] },
          },
        },
      ]);

      if (!installmentOrders || installmentOrders.length === 0)
        throw new customError('No installment order found', StatusCodes.NOT_FOUND);

      return installmentOrders;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }
}

export default new InventoryManagementService();
