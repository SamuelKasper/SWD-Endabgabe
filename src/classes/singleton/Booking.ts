import { Answers } from "prompts";
import { BookingDao } from "../../dao/bookingDao";
import { CarDao } from "../../dao/carDao";
import Console from "./Console";
import FileHandler from "./FileHandler";
import { User } from "./User";
import Utility from "./Utility";

export class Booking {
    //-------------------------------------------------- Singleton
    // Declare an instance of booking
    private static instance: Booking = new Booking();

    /** If trying to create another instance of booking */
    private constructor() {
        if (Booking.instance)
            throw new Error("Instead of using new Booking(), please use Booking.getInstance() for Singleton!")
        Booking.instance = this;
    }

    /** Returns an instance of the booking class */
    public static getInstance(): Booking {
        return Booking.instance;
    }

    //-------------------------------------------------- Booking
    /** Main booking process */
    public async startBookingProcess(_car: CarDao, _user: User): Promise<string[]> {
        // Ask for date, time and duration
        let dateAndDuration: string[] = await Utility.getDateAndDuration();
        let booking: BookingDao[] = await this.getACarsBookings(_car.model);
        let dateAndTimeValid: boolean = false;
        let durationValid: boolean = false;
        let carIsFree: boolean = false;
        let bookingProperties: string[] = [];

        //Check if the requestet time is valid (cars can only be used at specific times)
        if (await this.checkCarTimes(new Date(dateAndDuration[0]), dateAndDuration[1], _car)) {
            dateAndTimeValid = true;
        } else {
            Console.printLine("The car can only be used from " + _car.from + " until " + _car.to + ". Please choose another time.\n");
            await this.startBookingProcess(_car, _user);
        }

        // Check if the duration is valid (cars can only be used for a specific duration)
        if (parseInt(dateAndDuration[1]) <= _car.maxDuration) {
            durationValid = true;
        } else {
            Console.printLine("The maximum usage duration of this car is " + _car.maxDuration + " minutes.\nPlease choose a shorter duration.\n");
            await this.startBookingProcess(_car, _user);
        }

        //If the car has not been booked ever
        let carCounter: number = 0;
        for (let i = 0; i < booking.length; i++) {
            if (booking[i].carId == _car.id) {
                carCounter++;
            }
        }

        if (carCounter == 0) {
            carIsFree = true;
        } else {
            // Check if the car is free at the date and time (check id the car is already booked)
            if (await this.checkCarIsFree(booking, dateAndDuration[0], parseInt(dateAndDuration[1]))) {
                carIsFree = true;
            } else {
                Console.printLine("The car is already booked at that time. Try another or time.\n");
                let carOrDate: Answers<string> = await Console.showOptions(["Other date", "Exit",], "Do you want to try another date?");
                if (carOrDate.value == "1") {
                    await this.startBookingProcess(_car, _user);
                } else {
                    bookingProperties[0] = "exit";
                }
            }
        }

        if (dateAndTimeValid && durationValid && carIsFree) {
            bookingProperties = await this.createBookingProperties(_car, parseInt(dateAndDuration[1]), dateAndDuration[0], _user);
        }
        return bookingProperties;
    }

    /** Create an array of properties for the booking and return it */
    public async createBookingProperties(_car: CarDao, _requestedDuration: number, _reqestedDate: string, _user: User): Promise<string[]> {
        let bookingProperties: string[] = [];
        bookingProperties[0] = "exit";

        // Calculate the Price
        let price: number = Utility.calculatePrice(_requestedDuration, _car.price, _car.pricePerMin);

        // Generate the next ID. If there is no booking, set the first id = 0
        let bookings: BookingDao[] = await this.getAllBookings();
        let idArray: number[] = [];
        let id: number;
        if (bookings.length > 0) {
            for (let i = 0; i < bookings.length; i++) {
                idArray[i] = bookings[i].id;
            }
            id = Utility.generateNextID(idArray);
        } else {
            id = 0;
        }

        let confirmBooking: Answers<string> = await Console.showOptions(["Yes", "No",], "The price for the " + _car.model + " would be: " + price + "€. Do you want to book this offer?");
        if (confirmBooking.value == "1") {
            if (_user.accountState == "guest") {
                Console.printLine("Login to book a car.\n");
            } else {
                // Book the car
                bookingProperties[0] = "ok";
                bookingProperties[1] = id+"";
                bookingProperties[2] = _reqestedDate;
                bookingProperties[3] = _requestedDuration + "";
                bookingProperties[4] = price + "";
            }
        }
        return bookingProperties;
    }

    /** Returns an array of type BookingDao with the bookings of the given car */
    private async getACarsBookings(_selectedCar: string): Promise<BookingDao[]> {
        let selectedBookings: BookingDao[] = [];
        let bookings: BookingDao[] = await FileHandler.readJsonFile("./files/Booking.json");
        for (let i = 0; i < bookings.length; i++) {
            if (bookings[i].model == _selectedCar) {
                selectedBookings.push(bookings[i]);
            }
        }
        return selectedBookings;
    }

    /** Returns all bookings from the JSON */
    public async getAllBookings(): Promise<BookingDao[]> {
        let bookings: BookingDao[] = await FileHandler.readJsonFile("./files/Booking.json");
        return bookings;
    }

    /** Saves a car in the cars.json */
    public async bookACar(_id: number, _requestedDate: Date, _requestedDuration: number, _price: number, _user: User, _car: CarDao) {
        // Book the car
        let newBooking: BookingDao = { id: _id, carId: _car.id, model: _car.model, duration: _requestedDuration, from: _requestedDate, customer: _user.username, price: _price };
        FileHandler.writeJsonFile("./files/Booking.json", newBooking);
    }

    /** Check if the requested time is between the valid time */
    private async checkCarTimes(_requestedDate: Date, _requestedDuration: string, _car: CarDao): Promise<boolean> {
        let reqTime = new Date(_requestedDate);
        let reqTimeInMinutes: number = reqTime.getHours() * 60 + reqTime.getMinutes();
        let reqTimeInMinutesWithDuration: number = reqTimeInMinutes + parseInt(_requestedDuration);

        let fromInMinutes: number = await Utility.convertToMinutes(_car.from);
        let toInMinutes: number = await Utility.convertToMinutes(_car.to);

        if (fromInMinutes < reqTimeInMinutes && reqTimeInMinutesWithDuration < toInMinutes) {
            return true;
        }
        return false;
    }

    /** Check if the car is at the given date and time free*/
    private async checkCarIsFree(_booking: BookingDao[], _requestedDate: string, _requestedDuration: number): Promise<boolean> {
        // Would be null if there is no booking for this car
        for (let i = 0; i < _booking.length; i++) {
            let bookingDateNr: number = Date.parse(_booking[i].from + "");
            let reqDateNr: number = Date.parse(_requestedDate);

            // Calls convertedInMs
            let datesWithDuration: number[] = Utility.convertInMs(bookingDateNr, reqDateNr, _requestedDuration, _booking[i].duration);

            // If request + duration < bookingDate or request > bookingDate + duration -> car is free
            if (datesWithDuration[0] < bookingDateNr || reqDateNr > datesWithDuration[1]) {
                return true;
            }
        }
        return false;
    }

    /** Check which cars are free at the given Date date and time and return them */
    public async getAvailableCars(_cars: CarDao[], _requestedDate: string, _requestedDuration: number): Promise<CarDao[]> {
        // Get the bookings
        let allBooking: BookingDao[] = await this.getAllBookings();
        let availableCars: CarDao[] = [];
        let unavailableCars: string[] = [];

        booking: for (let j = 0; j < allBooking.length; j++) {
            let bookingDateNr: number = Date.parse(allBooking[j].from + "");
            let requestedDateNr: number = Date.parse(_requestedDate);

            // Calls convertedInMs
            let datesWithDuration: number[] = Utility.convertInMs(bookingDateNr, requestedDateNr, _requestedDuration, allBooking[j].duration);

            // Check if cars are booked and add them to unavailableCars
            if (datesWithDuration[0] < bookingDateNr || requestedDateNr > datesWithDuration[1]) {
            } else {
                // Add to unavailable Cars
                unavailableCars.push(allBooking[j].carId);
                continue booking;
            }
        }

        // Add all cars to availableCars except the cars from unavailableCars
        let counter: number = 0;
        skip: for (let j = 0; j < _cars.length; j++) {
            for (let k = 0; k < unavailableCars.length; k++) {
                if (_cars[j].id == unavailableCars[k]) {
                    continue skip;
                }
            }

            // Check if the duration is valid
            if (_requestedDuration <= _cars[j].maxDuration) {
                //Check if the requestet time is valid (cars can only be used at specific times)
                if (await this.checkCarTimes(new Date(_requestedDate), _requestedDuration.toString(), _cars[j])) {
                    // If the car is not a car from the unavailableCars array add it to available
                    availableCars[counter] = _cars[j];
                    counter++;
                }
            }
        }
        return availableCars;
    }

    //------------------------------------------------------------------------------# START: Show previous or upcoming bookings #
    /** Choose between previous or upcoming bookings and call printBookings */
    public async getBookingsToPrint(_user: string, _booking: BookingDao[], _old: boolean) {
        let amountOfBookings: number = 0;
        if (_user == "") {
            Console.printLine("Login to show your bookings.\n");
        } else {
            for (let i = 0; i < _booking.length; i++) {
                if (_user == _booking[i].customer) {
                    if (_old) {
                        if (Date.parse(_booking[i].from + "") < Date.parse(new Date() + "")) {
                            amountOfBookings++;
                            this.printBookings(_booking[i]);
                        }
                    } else {
                        if (Date.parse(_booking[i].from + "") > Date.parse(new Date() + "")) {
                            amountOfBookings++;
                            this.printBookings(_booking[i]);
                        }
                    }
                    Console.printLine("\n");
                }
            }
            if (amountOfBookings == 0) {
                Console.printLine("No bookings were found!\n");
            }
        }
    }

    /** Prints the previous or upcomaing bookings */
    private printBookings(_booking: BookingDao) {
        // Get the converted and formatted string values
        let convertedValues: string[] = Utility.getConvertedBookingDateAndTime(_booking);
        Console.printLine("Booked car: " + _booking.model + "\n");
        Console.printLine("Customer: " + _booking.customer + "\n");
        Console.printLine("Date: " + convertedValues[0] + "." + convertedValues[1] + "." + convertedValues[2] + ", " + convertedValues[3] + ":" + convertedValues[4] + "\n");
        Console.printLine("Duration: " + _booking.duration + " minutes\n");
    }
}
// Export the instance of Booking, so you can use it in other classes
export default Booking.getInstance();