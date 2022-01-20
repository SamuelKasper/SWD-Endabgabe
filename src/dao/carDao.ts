export interface CarDao{
    id: string;
    model: string;
    type: string;
    from: Date;
    to: Date;
    maxDuration: number;
    price: number;
    pricePerMin: number;
  } 