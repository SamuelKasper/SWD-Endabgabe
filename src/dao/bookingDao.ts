export interface BookingDao{
    model:string;
    from:Date;
    duration: number;
    customer: string;
    price: number;
}