export interface NetWorthDocument {
    _id?: string;
    userId: string;
    name: string;
    type: string;
    value: number;
    description: string;
    date: Date;
}
