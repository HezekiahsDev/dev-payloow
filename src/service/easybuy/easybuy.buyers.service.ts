import Joi from 'joi';
import EasyBuyOrderModel, {
  EasyBuyOrdersInstallmentPlan,
  EasyBuyOrdersInstallmentStatus,
  EasyBuyOrdersPaymentMethod,
  EasyBuyOrdersPaymentStatus,
} from '../../models/easybuy_orders.schema';
import {
  default as easybuy_productsSchema,
  default as EasyBuyProductModel,
} from '../../models/easybuy_products.schema';
import EasyBuyService from './easybuy.service';
import { Paginator } from '../../utils/pagination';
import customError from '../../utils/custom.errors';
import walletSchema from '../../models/wallet.schema';
import generateHashMac from '../../utils/generateHashMac';
import { generatePaymentCheckout } from '../../utils/payment';
import EasyBuyCartModel from '../../models/easybuy_cart.schema';
import userModel, { EasyBuyRole } from '../../models/user.schema';
import EasyBuyCategoryModel from '../../models/easybuy_categories.schema';
import { StatusCodes as HttpStatus, StatusCodes } from 'http-status-codes';
import { AuthRequest, IEasyBuyOrders, IEasyBuyProduct, IUser } from '../../types';
import transactionsSchema, { TransactionType } from '../../models/transactions.schema';
import EasyBuyDeliveryInformation from '../../models/easybuy_deliveryInformation.schema';
import EasyBuyCouponModel, { EasyBuyCouponType } from '../../models/easybuy_coupon.schema';

class EasyBuyBuyersService {
  async getAllProducts(req: AuthRequest) {
    try {
      const { error, value: data } = Joi.object({
        categoryId: Joi.string().optional(),
      })
        .options({ stripUnknown: true })
        .validate(req.query);

      if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

      let filter: any = {};

      // Check if there is a category filter

      if (data.categoryId) {
        // Check if the category exists
        const category = await EasyBuyCategoryModel.findById(data.categoryId).select(['_id']).lean().exec();
        if (!category) throw new customError('Category not found', StatusCodes.NOT_FOUND);
        filter = { ...filter, category: data.categoryId };
      }

      const products = await easybuy_productsSchema
        .find({
          $and: [{ stock: { $gt: 0 } }, filter],
        })
        .populate('category');
      if (products.length === 0) throw new customError('No products found');
      return {
        status: StatusCodes.OK,
        message: 'All products fetched successfully',
        data: products,
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: error instanceof Error ? error.message : 'An error occurred while fetching all products',
      };
    }
  }

  async getSingleProduct(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      productId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    try {
      const product = await easybuy_productsSchema.findOne({ _id: data.productId }).populate('category');

      if (!product) throw new customError('Product not found');

      return {
        status: StatusCodes.OK,
        message: 'Product fetched successfully',
        data: product,
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: error instanceof Error ? error.message : 'An error occurred while fetching the product',
      };
    }
  }

  async addEasyBuyProductToCart(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const user = await userModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.BUYER)
      throw new customError("You're not an EasyBuy Buyer", HttpStatus.BAD_REQUEST);

    const product = await EasyBuyProductModel.findById(data.productId).select(['_id', 'stock']).lean().exec();

    if (!product) throw new customError('Product not found', HttpStatus.NOT_FOUND);

    if (product.stock < data.quantity) throw new customError('Not enough in stock', HttpStatus.BAD_REQUEST);

    // Check if product is already in cart, if so then update the quantity
    let cartItem = await EasyBuyCartModel.findOne({ user: req.user?._id, product: data.productId });

    if (cartItem) {
      // Update the quantity
      cartItem.quantity += data.quantity;
      await cartItem.save();

      if (cartItem.quantity <= 0) {
        await cartItem.deleteOne();
        // Process Deletion
        return null;
      }

      return cartItem;
    }

    // Check if the quantity is greater than 0
    if (data.quantity <= 0) throw new customError('Quantity must be greater than 0', HttpStatus.BAD_REQUEST);

    cartItem = await EasyBuyCartModel.create({
      user: req.user?._id,
      product: data.productId,
      quantity: data.quantity,
    });

    return cartItem;
  }

  async removeEasyBuyProductFromCart(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      productId: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const user = await userModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.BUYER)
      throw new customError("You're not an EasyBuy Buyer", HttpStatus.BAD_REQUEST);

    const product = await EasyBuyProductModel.findById(data.productId).select(['_id']).lean().exec();

    if (!product) throw new customError('Product not found', HttpStatus.NOT_FOUND);

    const cartItem = await EasyBuyCartModel.findOne({ user: req.user?._id, product: data.productId });

    if (!cartItem) throw new customError('Product not in cart', HttpStatus.NOT_FOUND);

    await cartItem.deleteOne();
  }

  async getCartItems(req: AuthRequest) {
    const user = await userModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();
    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.BUYER)
      throw new customError("You're not an EasyBuy Buyer", HttpStatus.BAD_REQUEST);
    const cartItem = await EasyBuyCartModel.find({ user: req.user?._id })
      .select(['_id', 'product', 'quantity'])
      .populate('product', ['_id', 'name', 'description', 'price', 'imageKey', 'additionalImageKeys', 'color'])
      .lean()
      .exec();

    return cartItem;
  }

  async getBuyerDeliveryInformation(req: AuthRequest) {
    const profile = await userModel.findById(req.user?._id).select(['_id', 'easyBuyProfile']).lean().exec();

    if (!profile?.easyBuyProfile)
      throw new customError("You haven't created your Easybuy Profile", HttpStatus.BAD_REQUEST);

    const deliveryInformation = await EasyBuyDeliveryInformation.find({ user: req.user?._id }).lean().exec();

    return deliveryInformation;
  }

  async checkCoupon(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      code: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    let coupon = await EasyBuyCouponModel.findOne({ code: data.code })
      .select(['_id', 'status', 'type', 'code', 'discount', 'description', 'expiryDate', 'maxUsage'])
      .lean()
      .exec();

    if (!coupon) throw new customError('Invalid or expired coupon', HttpStatus.NOT_FOUND);

    // Check if coupon is valid
    if (!coupon.status) throw new customError('Coupon is no longer valid', HttpStatus.BAD_REQUEST);

    if (coupon.expiryDate < new Date()) throw new customError('Coupon has expired', HttpStatus.BAD_REQUEST);

    if (coupon.maxUsage <= coupon.usedBy.length)
      throw new customError('Coupon has reached its maximum usage', HttpStatus.BAD_REQUEST);

    return coupon;
  }

  async checkOut(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      coupon: Joi.string().allow(null).optional(),
      paymentMethod: Joi.string()
        .valid(...Object.values(EasyBuyOrdersPaymentMethod))
        .required(),
      installmentPlan: Joi.string()
        .valid(...Object.values(EasyBuyOrdersInstallmentPlan))
        .allow(null)
        .optional(),
    }).validate({ ...req.body, ...req.query });

    const user = (await userModel
      .findById(req.user?._id)
      .select(['_id', 'easyBuyRole', 'easyBuyProfile', 'wallet', 'email'])
      .populate('wallet', ['_id', 'balance'])
      .lean()
      .exec()) as IUser;

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.BUYER)
      throw new customError("You're not an EasyBuy Buyer", HttpStatus.BAD_REQUEST);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    // Get the user's cart items
    const cartItems = await EasyBuyCartModel.find({ user: req.user?._id })
      .select(['_id', 'product', 'quantity'])
      .populate('product', ['_id', 'price', 'partner'])
      .lean()
      .exec();

    let cartItemsInDb = [];
    let totalAmount = 0;

    for (const item of cartItems) {
      const { _id, price, partner } = item.product as IEasyBuyProduct;
      const { quantity } = item;

      cartItemsInDb.push({
        product: _id,
        quantity,
        price,
        partner,
      });

      totalAmount += Number(price) * quantity;
    }

    let result = null;
    let discountedAmount = 0;
    let paidWithWallet = false;

    if (data?.coupon) {
      const coupon = await EasyBuyService.checkCoupon({ body: { code: data.coupon } } as AuthRequest);

      if (coupon.type === EasyBuyCouponType.PERCENTAGE) {
        totalAmount -= (coupon.discount / 100) * totalAmount;
        discountedAmount = (coupon.discount / 100) * totalAmount;
      } else if (coupon.type === EasyBuyCouponType.FLAT) {
        totalAmount -= coupon.discount;
        discountedAmount = coupon.discount;
      }
    }

    if (data.paymentMethod === EasyBuyOrdersPaymentMethod.WALLET) {
      paidWithWallet = true;
      result = await this.payForCartItemsWithWallet({
        cartItemsInDb,
        totalAmount,
        user,
        discountedAmount,
        installmentPlan: data.installmentPlan,
        paidWithWallet,
      });
    } else if (data.paymentMethod === EasyBuyOrdersPaymentMethod.FLUTTERWAVE) {
      result = await this.payForCartItemsWithFlutterwave({
        cartItemsInDb,
        totalAmount,
        user,
        discountedAmount,
        installmentPlan: data.installmentPlan,
        paidWithWallet,
      });
    }

    return { result, paidWithWallet };
  }

  async createEasBuyOrder({
    cartItemsInDb,
    totalAmount,
    user,
    discountedAmount,
    installmentPlan,
    paidWithWallet,
  }: {
    user: IUser;
    cartItemsInDb: any;
    totalAmount: number;
    paidWithWallet: boolean;
    discountedAmount: number | null;
    installmentPlan: string | EasyBuyOrdersInstallmentPlan | null;
  }) {
    let installments: {
      amount: number;
      dueDate: Date;
      status: EasyBuyOrdersInstallmentStatus;
      paymentDate: null;
    }[] = [];

    if (installmentPlan) {
      installments = await this.generateInstallments(totalAmount, installmentPlan, 3);
    }

    const generatedOrderId = generateHashMac.generateRandomString();

    const order = await EasyBuyOrderModel.create({
      user: user._id,
      orderId: generatedOrderId,
      cartItems: cartItemsInDb,
      totalAmount: totalAmount,
      isDiscounted: false,
      paymentMethod: EasyBuyOrdersPaymentMethod.WALLET,
      paymentStatus: paidWithWallet ? EasyBuyOrdersPaymentStatus.PAID : EasyBuyOrdersPaymentStatus.PENDING, // If paidWithWallet is true, we set it to pay because we have validated the users balance else set it to pending.
      transactionReference: generateHashMac.generateHashReference(),
      discountedAmount,
      installmentDetails: {
        isInstallment: !!installmentPlan,
        installmentPlan,
        installments,
        orderId: generatedOrderId,
      },
    });

    return order;
  }

  async generateInstallments(
    totalAmount: number,
    installmentPlan: string | EasyBuyOrdersInstallmentPlan,
    numberOfInstallments: number,
    startDate: Date = new Date()
  ) {
    // Determine interval in days based on the plan
    const intervalDays = {
      [EasyBuyOrdersInstallmentPlan.WEEKLY]: 7,
      [EasyBuyOrdersInstallmentPlan.MONTHLY]: 30,
      [EasyBuyOrdersInstallmentPlan.QUARTERLY]: 90,
      [EasyBuyOrdersInstallmentPlan.ANNUALLY]: 365,
    }[installmentPlan] as number;

    const installmentAmount = Math.floor((totalAmount / numberOfInstallments) * 100) / 100; // Round to 2 decimal places
    const remainder = Math.round((totalAmount - installmentAmount * numberOfInstallments) * 100) / 100;

    const installments = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + intervalDays * i);

      installments.push({
        amount: i === numberOfInstallments - 1 ? installmentAmount + remainder : installmentAmount,
        dueDate,
        status: EasyBuyOrdersInstallmentStatus.PENDING,
        paymentDate: null,
      });
    }

    return installments;
  }

  async payForCartItemsWithWallet({
    cartItemsInDb,
    totalAmount,
    user,
    discountedAmount,
    installmentPlan,
    paidWithWallet,
  }: {
    user: IUser;
    cartItemsInDb: any;
    totalAmount: number;
    paidWithWallet: boolean;
    installmentPlan: string | null;
    discountedAmount: number | null;
  }): Promise<IEasyBuyOrders> {
    if ((user.wallet as any).balance < totalAmount)
      throw new customError('Insufficient balance in wallet', HttpStatus.BAD_REQUEST);

    const checkWalletBalance = await walletSchema.findOne({ user: user._id, balance: { $gte: totalAmount } });

    if (!checkWalletBalance) throw new customError('Insufficient balance in wallet', HttpStatus.BAD_REQUEST);

    const order = await this.createEasBuyOrder({
      cartItemsInDb,
      totalAmount,
      user,
      discountedAmount,
      installmentPlan,
      paidWithWallet,
    });

    let totalToPay = order.isDiscounted ? order.discountedAmount : order.totalAmount;

    // Check if it's an installment plan
    if (order.installmentDetails.isInstallment) {
      totalToPay = order.installmentDetails.installments[0].amount;
    }

    await Promise.all([
      walletSchema.findOneAndUpdate(
        { user: user._id },
        {
          $inc: { balance: -totalToPay },
        }
      ),
      EasyBuyCartModel.deleteMany({ user: user._id }),
    ]);

    return order;
  }

  async payForCartItemsWithFlutterwave({
    cartItemsInDb,
    totalAmount,
    user,
    discountedAmount,
    installmentPlan,
    paidWithWallet,
  }: {
    user: IUser;
    cartItemsInDb: any;
    totalAmount: number;
    paidWithWallet: boolean;
    discountedAmount: number | null;
    installmentPlan: string | null;
  }): Promise<{ order: IEasyBuyOrders; checkout_url: string }> {
    const order = await this.createEasBuyOrder({
      cartItemsInDb,
      totalAmount,
      user,
      discountedAmount,
      installmentPlan,
      paidWithWallet,
    });

    let totalToPay = order.isDiscounted ? order.discountedAmount : order.totalAmount;

    // Check if it's an installment plan
    if (order.installmentDetails.isInstallment) {
      totalToPay = order.installmentDetails.installments[0].amount;
    }

    // Generate the checkout url
    const checkout_url = await generatePaymentCheckout(user, totalToPay, TransactionType.EASY_BUY, null);

    return { order, checkout_url };
  }

  async getInstallmentOrders(req: AuthRequest) {
    const paginator = new Paginator<IEasyBuyOrders>(EasyBuyOrderModel, 1, 10, {
      filter: { user: req.user?._id, 'installmentDetails.isInstallment': true },
      populate: { path: 'cartItems.product', select: ['_id', 'name', 'price', 'imageKey'] },

      sort: { createdAt: -1 },
    });

    const paginatedOrders = await paginator.paginate();

    return paginatedOrders;
  }

  async getAllEasyBuyTransactions(req: AuthRequest) {
    const transactions = await transactionsSchema
      .find({ userId: req.user?._id, transactionType: TransactionType.EASY_BUY })
      .lean()
      .exec();

    if (transactions.length === 0) throw new customError('No transactions found', HttpStatus.NOT_FOUND);

    return transactions;
  }

  async getOrders(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
    })
      .options({ stripUnknown: true })
      .validate(req.query);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const paginator = new Paginator<IEasyBuyOrders>(EasyBuyOrderModel, data.page, data.limit, {
      filter: { user: req.user?._id },
      populate: { path: 'cartItems.product', select: ['_id', 'name', 'price', 'imageKey'] },
    });

    const paginatedOrders = await paginator.paginate();

    const results = paginatedOrders.data.flatMap((order) =>
      order.cartItems.map((item) => ({
        ...item,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        transactionReference: order.transactionReference,
        createdAt: order.createdAt,
      }))
    );

    return {
      data: results,
      meta: paginatedOrders.meta,
    };
  }

  async deleteAllProductInCart(req: AuthRequest) {
    try {
      await EasyBuyCartModel.deleteMany({ user: req.user?._id });

      return {
        statusCode: StatusCodes.OK,
        message: 'All products in cart deleted successfully',
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
}

export default new EasyBuyBuyersService();
