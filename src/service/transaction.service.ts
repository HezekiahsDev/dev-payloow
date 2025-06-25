import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { ITransaction, IUser } from '../types/index';
import TransactionModel, { TransactionType, TransactionStatus, TransactionMethodType, TransactionMerchant } from '../models/transactions.schema';
import customError from '../utils/custom.errors';
import { StatusCodes } from 'http-status-codes';

class TransactionService {
  async createTransaction(options: { user: string, amount: number, type:TransactionType, status: TransactionStatus, methodType: TransactionMethodType, merchant: TransactionMerchant, narration?: string, reference?: string }) {

    const amount = Types.Decimal128.fromString(options.amount.toFixed(2));

    if (!options.reference) {
      options.reference = uuidv4();
    }

    const context = {
      ...options,
      amount,
    };

    return TransactionModel.create(context);
  }


   async getTransaction(transactionId: string): Promise<ITransaction> {
    const transaction = await TransactionModel.findById(transactionId).lean().exec();

    if (!transaction) {
      throw new customError("Transaction not found", StatusCodes.NOT_FOUND);
    }
    return transaction;
  }

  async getTransactionByUser(user: IUser, transactionId: string): Promise<ITransaction> {
    const transaction = await TransactionModel.findOne({ user: user._id, _id: transactionId }).lean().exec();

    if (!transaction) {
      throw new customError("Transaction not found", StatusCodes.NOT_FOUND);
    }
    return transaction;
  }

//   async getAllTransactions(transactionFilterDto: TransactionFilterDto, paginationDto: PaginationDto): Promise<IPaginationResult<Transaction>> {
//     const paginator = new Paginator<Transaction>(this.transactionModel as unknown as Model<Transaction>, paginationDto.page, paginationDto.limit, { filter: { ...transactionFilterDto } });

//     const result = await paginator.paginate();

//     return result;
//   }
}

export default new TransactionService();
