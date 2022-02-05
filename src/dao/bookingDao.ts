export interface BookingDao{
    id: number;
    carId: string,
    model:string;
    from:Date;
    duration: number;
    customer: string;
    price: number;
}