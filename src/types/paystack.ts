export interface PaystackSuccessResponse<T> {
    status: string;
    message: string;
    data: T;
}

export interface IBanks {
    id: number;
    name: string;
    code: string;
    currency: string;
    type: string;
    active: boolean;
    is_deleted: boolean;
    country: string;
}

export interface IDva {
    account_name: string;
    account_number: string;
    currency: string;
    bank: IBanks;
}

export interface ICustomer {
    first_name: string,
    last_name: string,
    email: string,
    domain: string,
    customer_code: string,
    id: number,
}

export interface InitializeTransaction {
    authorization_url: string,
    access_code: string,
    reference: string
}