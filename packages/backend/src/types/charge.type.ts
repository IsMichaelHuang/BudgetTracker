export interface ChargeDocument {
    _id?: string;
    userId: string;
    categoryId: string;
    description: string;
    amount: number;
    date: Date;
}
