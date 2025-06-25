import { Request } from 'express';
import mongoose, { Document } from 'mongoose';
import { BnvStatus } from '../models/user.schema';
import {
  EasyBuyOrdersInstallmentStatus,
  EasyBuyOrdersOrderStatus,
  EasyBuyOrdersPaymentMethod,
  EasyBuyOrdersPaymentStatus,
} from '../models/easybuy_orders.schema';

export interface ITokens {
  _id: string;
  phone: number;
  role: string;
}

export interface IMessage extends Document {
  text: string;
  sender_id: IUser;
  tutor_id: IUser;
  course_id: ICourse;
  reply_to: mongoose.Types.ObjectId | null;
}
export interface ICourseEnroll extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  course_id: mongoose.Schema.Types.ObjectId;
  status: 'enrolled' | 'completed';
  created_at: Date;
}
export interface ICourseAnnouncement extends Document {
  course_id: IUser;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}
export interface ICourseCart extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  course_id: mongoose.Schema.Types.ObjectId;
  PaymentStatus: 'pending' | 'completed';
  created_at?: Date;
}
export interface IDva extends Document {
  userId: IUser;
  customerCode: string;
  bankName: string;
  accountNumber: string;
  dvaReference: string;
}
export interface IQuizAttempt extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  quiz_id: mongoose.Schema.Types.ObjectId;
  score: number;
  max_score: number;
  passed: boolean;
  created_at?: Date;
}
export interface IQuestion extends Document {
  quiz_id: mongoose.Schema.Types.ObjectId;
  question_text: string;
  options: {
    option: string;
    is_correct: boolean;
  }[];
  created_at: Date;
  updated_at: Date;
}
export interface IQuiz extends Document {
  title: string;
  course_id: mongoose.Schema.Types.ObjectId;
  lesson_id: mongoose.Schema.Types.ObjectId;
  tutor_id: mongoose.Schema.Types.ObjectId;
  questions: mongoose.Schema.Types.ObjectId[];
  created_at?: Date;
  updated_at?: Date;
}
export interface IUserAnswer extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  quiz_id: mongoose.Schema.Types.ObjectId;
  question_id: mongoose.Schema.Types.ObjectId;
  selected_option: string;
  is_correct: boolean;
  created_at?: Date;
}
export interface Payload {
  user: ITokens;
  refreshToken?: string;
}
export interface ISection extends Document {
  course_id: mongoose.Schema.Types.ObjectId;
  title: string;
  description: string;
  lessons: mongoose.Schema.Types.ObjectId[];
}
export interface IProgress extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  course_id: mongoose.Schema.Types.ObjectId;
  completedLessons: mongoose.Schema.Types.ObjectId[];
  progressPercentage: number;
  markLessonCompleted: (lessonId: string) => Promise<IProgress>;
}
export interface ILesson extends mongoose.Document {
  section_id: mongoose.Schema.Types.ObjectId;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  public_id: string;
}
export interface ICourse extends Document {
  title: string;
  description: string;
  tutor_id: mongoose.Schema.Types.ObjectId;
  tutor_name: string;
  duration: string;
  price: number;
  discount_price: number;
  category: string;
  tags: string[];
  video_url: string;
  students_enrolled: number;
  averageRating: number;
  numberOfReviews: number;
  thumbnailUrl: string;
  course_documents: string[];
  sections: mongoose.Schema.Types.ObjectId[];
  lessons_count: number;
  updated_at: Date;
  created_at: Date;
  public_id: string;
}

export interface IEasyBuyOrders extends Document {
  user: mongoose.Schema.Types.ObjectId;
  orderId: string;
  cartItems: {
    product: mongoose.Schema.Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  paymentStatus: EasyBuyOrdersPaymentStatus;
  totalAmount: number;
  discountedAmount: number;
  isDiscounted: boolean;
  orderStatus: EasyBuyOrdersOrderStatus;
  paymentMethod: EasyBuyOrdersPaymentMethod;
  transactionReference: string;
  installmentDetails: {
    isInstallment: boolean;
    installmentPlan: string | null;
    installments: {
      amount: number;
      dueDate: Date;
      status: EasyBuyOrdersInstallmentStatus;
      paymentDate: Date;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ITutorReply extends Document {
  question_id: mongoose.Schema.Types.ObjectId;
  tutor_id: mongoose.Schema.Types.ObjectId;
  reply: string;
  created_at?: Date;
  updated_at?: Date;
}
export interface IQuestion extends Document {
  question: string;
  course_id: mongoose.Schema.Types.ObjectId;
  section_id: mongoose.Schema.Types.ObjectId;
  lesson_id: mongoose.Schema.Types.ObjectId;
  tutor_id: mongoose.Schema.Types.ObjectId;
  tutor_reply: string;
  replies: mongoose.Schema.Types.ObjectId[];
  title: string;
  created_at: Date;
  updated_at: Date;
}
export interface IPin extends Document {
  pin: string;
  user: IUser;
}
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  phone: number;
  password?: string;
  balance: mongoose.Types.Decimal128;
  accountDisabled: boolean;
  role: 'admin' | 'superAdmin' | 'user' | 'tutor' | 'partner' | 'investor';
  createdAt?: Date;
  updatedAt?: Date;
  resetPasswordToken?: string | null;
  resetPasswordExpire?: Date | null;
  referenceId?: string;
  paystackCustomerCode: string | null;
  referralCode?: string | null;
  transactionPin?: string | null;
  virtualAccount?: mongoose.Schema.Types.ObjectId;
  isStep: 0 | 1 | 2;
  country: String;
  bvn: number;
  state: String;
  Address: String;
  nin: string;
  email: string;
  publicId: string | undefined;
  profilePicture: string | undefined;
  notification: [{ title: string; body: string; createdAt: string }];
  isVerified?: boolean;
  pin?: Boolean;
  bnvStatus: BnvStatus;
  bvnVerified?: boolean;
  dva?: mongoose.Schema.Types.ObjectId;
  wallet?: mongoose.Schema.Types.ObjectId;
  topUpAccount?: 0 | 1 | 2 | undefined;
  previousReference?: [{ title: string; body: string; code: string }];
  isTutorVerified?: boolean | null;
  easyBuyRole?: 'buyer' | 'partner' | null;
  easyBuyProfile?: mongoose.Types.ObjectId | null;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}
export interface IRating extends Document {
  course_id: mongoose.Schema.Types.ObjectId;
  student_id: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface ILedgerWallet extends Document {
  user: IUser;
  balance: number;
  createdAt: string;
}

export interface ITutors extends Document {
  isVerified: boolean;
  tutor_id: IUser;
  tutor_name: string;
  tutor_email: string;
  tutor_phone: string;
  tutor_about: string;
  tutor_image: string;
  tutor_qualification: string;
  tutor_experience: string;
  tutor_achievements: string;
  tutor_facebook: string;
  tutor_twitter: string;
  tutor_linkedin: string;
  tutor_instagram: string;
}
export interface IProfile extends Document {
  fName: string;
  lName: string;
  nin: string;
  phoneNumber: number;
  bankAccountForms: [
    {
      bankName: string;
      accountNumber: string;
      accountName: string;
      bvn: string;
      publicId: string;
      isVerified: boolean;
      documentFileLink: string;
    },
  ];
  isVerified: boolean;
  user: IUser;
}
export interface IEmail {
  code?: string;
  token?: string;
  user?: IUser;
  origin?: string;
  receiverEmail?: string;
  senderId?: string;
  senderEmail?: string;
  amount?: number;
  body?: string;
  title?: string;
  createdAt?: string;
}
export interface IWallet extends Document {
  user: IUser;
  balance: Number;
  amount?: Number;
  status?: ['pending', 'cancelled', 'success'];
  voucherCode?: string;
  createdAt?: string;
  usedAt?: string;
  voucherStatus?: 'used' | 'unused';
  createdByUser: IUser;
  owner: string;
  receiverPhoneNumber?: string;
  senderPhoneNumber?: string;
  narration?: string;
  updatedAt?: string;
}

export interface ITransaction extends Document {
  user: IUser;
  amount: number;
  type: string;
  status: string;
  merchant: string;
  methodType: string;
  reference?: string;
  narration: string;
  createdAt: string;
}

export interface ISwapEasyBuy extends Document {
  product_id: mongoose.Schema.Types.ObjectId;
  product_name: string;
  user_id: mongoose.Schema.Types.ObjectId;
  brand_name: string;
  model_name: string;
  description: string;
  image_view: Map<string, string>;
}

export interface IToken extends Document {
  refreshToken: string;
  ip: string;
  userAgent: string;
  isValid: boolean;
  user: IUser;
}

export interface INotification extends Document {
  title: string;
  body: string;
  user: IUser;
  createdAt: string;
}

export interface AuthRequest extends Request {
  user?: ITokens;
}

export interface IProduct extends Document {
  name: String;
  price: String;
  description: String;
  image: String;
  productCategory: String;
  featured: String;
  freeShipping: String;
  inventory: String;
  averageRating: String;
  numOfReviews: String;
  public_id: String;
  Vendor_user: IUser;
  Weight: Number;
}

export interface ICart extends Document {
  item: IProduct;
  quantity: number;
  user: IUser;
  specialOrders: Boolean;
  foodItems: [{ name: String }, { alternativeFoodItemName: string }];
  alternativeFoodItemName: String;
  comment: String;
  specificLocation: [{ city: String; state: String }];
}

export interface ICheck extends Document {
  user: IUser;
}

export interface IReviews {
  rating: Number;
  product: IProduct;
  user: IUser;
  comment: String;
  calculateAverageRating(productId: IProduct): Promise<void>;
}

export interface ITracker {
  user: IUser;
  productCode: String;
  currentLocation: String;
  previousLocation: String;
  status: String;
  storedItemsLocation: [{ previousLocation: String; currentLocation: String }];
}
export interface IForm {
  amount: Number;
  full_name: String;
  email: String;
  metadata: {
    vendorId: IUser;
    userId: String;
    transaction_type: String;
    refCode: String;
  };
}
export interface IKyc {
  BvnName: String;
  bankVerificationNumber: Number;
  isVerified: Boolean;
  image: String;
  publicId: String;
  user: IUser;
}

export interface IOder {
  user: IUser;
  vendorId: IUser;
  products: {
    product: IProduct;
    quantity: number;
  }[];
  orderDate: String;
  totalAmount: Number;
  orderStatus: String;
  deliveryAddress: String;
  deliveryDate: String;
}

export interface IEasyBuyProfile extends Document {
  user: mongoose.Types.ObjectId | IUser;
  fullName: string;
  phoneNumber: string;
  address: string;
  country: string;
  state: string;
  nin: string;
  employmentStatus: string;
  bvn: string;
  referralCode?: string | null;
  income?: number | null;
  deliveryInformation: mongoose.Types.ObjectId;
}

export interface IEasyBuyCategories extends Document {
  name: string;
}

export interface IEasyBuyProduct extends Document {
  partner: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: mongoose.Schema.Types.Decimal128 | number;
  color?: string[] | null;
  image: mongoose.Types.ObjectId;
  imageUrl: string;
  additionalImages: mongoose.Types.ObjectId[];
  additionalImagesUrls: string[];
  stock: number;
  isFeatured: boolean;
  category: mongoose.Types.ObjectId;
}

export interface IEasyBuyCart {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId | IEasyBuyProduct;
  quantity: number;
}

export interface IEasyBuyDeliveryInformation extends Document {
  user: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  address: string;
  phoneNumber: string;
}

export interface IEasyBuyServiceCenters extends Document {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  location: {
    type: string;
    coordinates: [number, number];
  };

  partner: mongoose.Types.ObjectId;
}
