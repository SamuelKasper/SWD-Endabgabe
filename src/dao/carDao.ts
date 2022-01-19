export interface CarDao{
    ID: string;
    model: string;
    type: string;
    from: Date;
    to: Date;
    maxDuration: number;
    price: number;
    pricePerMin: number;
  } 