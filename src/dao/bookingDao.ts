export interface BookingDao{
    carId: string,
    model:string;
    from:Date;
    duration: number;
    customer: string;
    price: number;
}