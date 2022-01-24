import { Answers } from "prompts";
import { BookingDao } from "../dao/bookingDao";
import { CarDao } from "../dao/carDao";
import { UserDao } from "../dao/userDao";
import Console from "./singleton/Console";
import FileHandler from "./singleton/FileHandler";
import { User } from "./User";

export class Booking {
    private car!: CarDao;
    private customer!: User;

    public setCarAndUser(_selectedCar: CarDao, _customer: User) {
        this.car = _selectedCar;
        this.customer = _customer;
    }

    /** Main booking process */
    public async startBookProcess(): Promise<void> {
        // Ask for date, time and duration
        let reqDate: Answers<string> = await Console.waitForDate("Enter the date and the time you want to use the car:");
        let reqDuration: Answers<string> = await Console.waitForAnswers("Enter the duration (minutes) you want to use the car", 'text');

        //Check if the requestet time is valid
        if (await this.checkCarTimes(reqDate.value, reqDuration.value)) {
            // Check if the duration is valid
            if (reqDuration.value <= this.car.maxDuration) {
                // Get the bookings
                let booking: BookingDao[] = await this.getBookings(this.car.model);
                // Check if the car is at the given date and time free
                let carIsFree: boolean = true;

                for (let i = 0; i < booking.length; i++) {
                    let bookingDateNr: number = Date.parse(booking[i].from + "");
                    let reqDateNr: number = Date.parse(reqDate.value);
                    // Convert the minutes into milliseconds
                    let reqDurationInMs: number = reqDuration.value * 60 * 1000;
                    let bookingDurationInMs: number = booking[i].duration * 60 * 1000;
                    let reqDateWithDuration: number = reqDateNr + reqDurationInMs;
                    let bookingDateWithDuration: number = bookingDateNr + bookingDurationInMs;

                    // If request + duration < bookingDate or request > bookingDate + duration -> car is free
                    if (reqDateWithDuration < bookingDateNr || reqDateNr > bookingDateWithDuration) {
                        //nothing
                    } else {
                        carIsFree = false;
                    }
                }

                if (carIsFree) {
                    // Calculate the Price
                    let price: number = this.calculatePrice(reqDuration.value, this.car.price, this.car.pricePerMin);

                    let confirmBooking: Answers<string> = await Console.showOptions(["Yes", "No",], "The price for the " + this.car.model + " would be: " + price + "€. Do you want to book this offer?");
                    if (confirmBooking.value == "1") {
                        if (this.customer.getAccountState() == "guest") {
                            console.log("Log in to book a car.");
                        } else {
                            // Book the car
                            await this.bookACar(reqDate.value, reqDuration.value, price);
                            console.log("Car was successfully booked!");
                        }
                    }
                } else {
                    console.log("The car is already booked at that time. Try another or time.");
                    let carOrDate: Answers<string> = await Console.showOptions(["Other date", "Exit",], "Do you want to try another date?");
                    if (carOrDate.value == "1") {
                        await this.startBookProcess();
                    }
                }
            } else {
                console.log("The maximum usage duration of this car is " + this.car.maxDuration + " minutes.\nPlease choose a shorter duration.");
                await this.startBookProcess();
            }
        } else {
            console.log("The car can only be used from " + this.car.from + " until " + this.car.to + ". Please choose another time.");
            await this.startBookProcess();
        }
    }

    /** Returns an array of type BookingDao with the bookings of the given car */
    public async getBookings(_selectedCar: string): Promise<BookingDao[]> {
        let selectedBookings: BookingDao[] = [];
        let bookings: BookingDao[] = await FileHandler.readJsonFile("./files/Booking.json");
        for (let i = 0; i < bookings.length; i++) {
            if (bookings[i].model == _selectedCar) {
                selectedBookings.push(bookings[i]);
            }
        }
        return selectedBookings;
    }

    public async getAllBookings(): Promise<BookingDao[]> {
        let bookings: BookingDao[] = await FileHandler.readJsonFile("./files/Booking.json");
        return bookings;
    }

    /** Saves a car in the cars.json */
    public async bookACar(_reqDate: Date, _reqDuration: number, _price: number) {
        // Book the car
        let newBooking: BookingDao = { carId: this.car.id, model: this.car.model, duration: _reqDuration, from: _reqDate, customer: this.customer.customer, price: _price };
        FileHandler.writeJsonFile("./files/Booking.json", newBooking);
    }

    /** Calculates the price for the car */
    public calculatePrice(_duration: number, _price: number, _pricePerMinute: number): number {
        let totalPrice: number = _price + _duration * _pricePerMinute / 100;
        return totalPrice;
    }

    /** Converts the given time (8:00 etc.) to minutes */
    public async convertToMinutes(_time: Date): Promise<number> {
        let timeString: string = _time + "";
        let timeSplitted = timeString.split(":");
        let minutes = parseInt(timeSplitted[0]) * 60 + parseInt(timeSplitted[1]);
        return minutes;
    }

    /** Check if the requested time is between the valid time */
    public async checkCarTimes(_reqDate: Date, _reqDuration: string): Promise<boolean> {
        let reqTime = new Date(_reqDate);
        let reqTimeInMinutes: number = reqTime.getHours() * 60 + reqTime.getMinutes();
        let reqTimeInMinutesWithDuration: number = reqTimeInMinutes + parseInt(_reqDuration);

        let fromInMinutes: number = await this.convertToMinutes(this.car.from);
        let toInMinutes: number = await this.convertToMinutes(this.car.to);

        if (fromInMinutes < reqTimeInMinutes && reqTimeInMinutesWithDuration < toInMinutes) {
            return true;
        }
        return false;
    }

    /** Check if the car is free at that date and time */
    public async checkCarIsFree(_cars: CarDao[]): Promise<CarDao[]> {
        // Ask for date, time and duration
        let reqDate: Answers<string> = await Console.waitForDate("Enter the date and the time you want to use the car:");
        let reqDuration: Answers<string> = await Console.waitForAnswers("Enter the duration (minutes) you want to use the car", 'text');
        // Get the bookings
        let booking: BookingDao[] = await this.getAllBookings();
        // Check if the car is at the given date and time free
        let availableCars: CarDao[] = [];
        let availableCounter: number = 0;

        for (let i = 0; i < booking.length; i++) {
            let bookingDateNr: number = Date.parse(booking[i].from + "");
            let reqDateNr: number = Date.parse(reqDate.value);
            // Convert the minutes into milliseconds
            let reqDurationInMs: number = reqDuration.value * 60 * 1000;
            let bookingDurationInMs: number = booking[i].duration * 60 * 1000;
            let reqDateWithDuration: number = reqDateNr + reqDurationInMs;
            let bookingDateWithDuration: number = bookingDateNr + bookingDurationInMs;
            let alreadyAdded: boolean = false;

            // check if car is free and save the car in the availableCars array
            if (reqDateWithDuration < bookingDateNr || reqDateNr > bookingDateWithDuration) {
                for (let j = 0; j < _cars.length; j++) {
                    if (_cars[j].id == booking[i].carId) {
                        for (let k = 0; k < availableCars.length; k++) {
                            if (availableCars[k].id == _cars[j].id) {
                                alreadyAdded = true;
                            }
                        }
                        if (!alreadyAdded) {
                            availableCars[availableCounter] = _cars[j];
                            availableCounter++;
                        }
                    }
                }
            }
        }

        /* for (let i = 0; i < availableCars.length; i++) {
            console.log(availableCars[i].model);
        } */
        return availableCars;
    }
}
