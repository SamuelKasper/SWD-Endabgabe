import { Answers } from "prompts";
import { BookingDao } from "../dao/bookingDao";
import { CarDao } from "../dao/carDao";
import Console from "./singleton/Console";
import FileHandler from "./singleton/FileHandler";
import { User } from "./User";
import Utility from "./Utility";

export class Booking {

    /** Main booking process */
    public async startBookProcess(_car: CarDao, _user: User): Promise<string[]> {
        // Ask for date, time and duration
        let reqDate: Answers<string> = await Console.waitForDate("Enter the date and the time you want to use the car:");
        let reqDuration: Answers<string> = await Console.waitForAnswers("Enter the duration (minutes) you want to use the car", 'text');
        let booking: BookingDao[] = await this.getBookings(_car.model);
        let dateAndTimeValid: boolean = false;
        let durationValid: boolean = false;
        let carIsFree: boolean = false;
        let bookingProperties: string[] = [];

        //Check if the requestet time is valid (cars can only be used at specific times)
        if (await this.checkCarTimes(reqDate.value, reqDuration.value, _car)) {
            dateAndTimeValid = true;
        } else {
            console.log("The car can only be used from " + _car.from + " until " + _car.to + ". Please choose another time.");
            await this.startBookProcess(_car, _user);
        }

        // Check if the duration is valid (cars can only be used for a specific duration)
        if (reqDuration.value <= _car.maxDuration) {
            durationValid = true;
        } else {
            console.log("The maximum usage duration of this car is " + _car.maxDuration + " minutes.\nPlease choose a shorter duration.");
            await this.startBookProcess(_car, _user);
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

            if (await this.checkCarIsFree(booking, reqDate.value, reqDuration.value)) {
                carIsFree = true;
            } else {
                console.log("The car is already booked at that time. Try another or time.");
                let carOrDate: Answers<string> = await Console.showOptions(["Other date", "Exit",], "Do you want to try another date?");
                if (carOrDate.value == "1") {
                    await this.startBookProcess(_car, _user);
                } else {
                    bookingProperties[0] = "exit";
                }
            }
        }

        if (dateAndTimeValid && durationValid && carIsFree) {
            bookingProperties = await this.createBookingProperties(_car, reqDuration.value, reqDate.value, _user);
        }
        return bookingProperties;
    }

    public async createBookingProperties(_car: CarDao, _reqDuration: number, _reqDate: string, _user: User): Promise<string[]> {
        let bookingProperties: string[] = [];
        bookingProperties[0] = "exit";

        // Calculate the Price
        let price: number = this.calculatePrice(_reqDuration, _car.price, _car.pricePerMin);

        let confirmBooking: Answers<string> = await Console.showOptions(["Yes", "No",], "The price for the " + _car.model + " would be: " + price + "€. Do you want to book this offer?");
        if (confirmBooking.value == "1") {
            if (_user.getAccountState() == "guest") {
                console.log("Log in to book a car.");
            } else {
                // Book the car
                bookingProperties[0] = "ok";
                bookingProperties[1] = _reqDate;
                bookingProperties[2] = _reqDuration + "";
                bookingProperties[3] = price + "";
            }
        }
        return bookingProperties;
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
    public async bookACar(_reqDate: Date, _reqDuration: number, _price: number, _user: User, _car: CarDao) {
        // Book the car
        let newBooking: BookingDao = { carId: _car.id, model: _car.model, duration: _reqDuration, from: _reqDate, customer: _user.customer, price: _price };
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
    public async checkCarTimes(_reqDate: Date, _reqDuration: string, _car: CarDao): Promise<boolean> {
        let reqTime = new Date(_reqDate);
        let reqTimeInMinutes: number = reqTime.getHours() * 60 + reqTime.getMinutes();
        let reqTimeInMinutesWithDuration: number = reqTimeInMinutes + parseInt(_reqDuration);

        let fromInMinutes: number = await this.convertToMinutes(_car.from);
        let toInMinutes: number = await this.convertToMinutes(_car.to);

        if (fromInMinutes < reqTimeInMinutes && reqTimeInMinutesWithDuration < toInMinutes) {
            return true;
        }
        return false;
    }

    /** Check if the car is at the given date and time free*/
    public async checkCarIsFree(_booking: BookingDao[], _reqDate: string, _reqDuration: number): Promise<boolean> {
        // Would be null if there is no booking for this car
        for (let i = 0; i < _booking.length; i++) {
            let bookingDateNr: number = Date.parse(_booking[i].from + "");
            let reqDateNr: number = Date.parse(_reqDate);

            // Calls convertedInMs
            let datesWithDuration: number[] = Utility.convertInMs(bookingDateNr, reqDateNr, _reqDuration, _booking[i].duration);

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
            // If the car is not a car from the unavailableCars array add it to available
            availableCars[counter] = _cars[j];
            counter++;
        }
        return availableCars;
    }

    /** Ask the user to input the Date and duration */
    public async getDateAndDuration(): Promise<string[]> {
        let dateAndDuration: string[] = [];
        // Ask for date, time and duration
        let reqDate: Answers<string> = await Console.waitForDate("Enter the date and the time you want to use the car:");
        let reqDuration: Answers<string> = await Console.waitForAnswers("Enter the duration (minutes) you want to use the car", 'text');
        dateAndDuration[0] = reqDate.value;
        dateAndDuration[1] = reqDuration.value;
        return dateAndDuration;
    }

    //------------------------------------------------------------------------------# START: Show previous or upcoming bookings #
    /** Choose between old or new bookings and call printBookings */
    public async decideWhichBookings(_user: string, _booking: BookingDao[], _old: boolean) {
        let amountOfBookings: number = 0;
        if (_user == "") {
            console.log("Log in to show your bookings");
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
                            amountOfBookings
                            this.printBookings(_booking[i]);
                        }
                    }
                    console.log("");
                }
            }
            if (amountOfBookings == 0) {
                console.log("No bookings were found!");
            }
        }
    }

    /** Prints the past or future bookings */
    public printBookings(_booking: BookingDao) {
        // Get the converted and formatted string values
        let convertedValues: string[] = this.getConvertedBookingDateAndTime(_booking);
        console.log("Booked car: " + _booking.model);
        console.log("Customer: " + _booking.customer);
        console.log("Date: " + convertedValues[0] + "." + convertedValues[1] + "." + convertedValues[2] + ", " + convertedValues[3] + ":" + convertedValues[4]);
        console.log("Duration: " + _booking.duration + " minutes");
    }

    /** Converts the Date to single numbers and returns them in an array */
    public getConvertedBookingDateAndTime(_booking: BookingDao): string[] {
        // variables
        let converted: string[] = [];
        let dayString: string = "", monthString: string = "", yearString: string = "", hoursString: string = "", minutesString: string = "";

        //format day
        let dayNr: number = new Date(_booking.from).getDate();
        if (dayNr < 10) { dayString = "0" + dayNr; } else { dayString = dayNr + ""; }
        converted.push(dayString);

        //format month
        let monthNr: number = new Date(_booking.from).getMonth();
        monthNr = monthNr + 1;
        if (monthNr < 10) { monthString = "0" + monthNr; } else { monthString = monthNr + ""; }
        converted.push(monthString);

        //format year
        let yearNr: number = new Date(_booking.from).getFullYear();
        if (yearNr < 10) { yearString = "0" + yearNr; } else { yearString = yearNr + ""; }
        converted.push(yearString);

        //format hours
        let hoursNr: number = new Date(_booking.from).getHours();
        if (hoursNr < 10) { hoursString = "0" + hoursNr; } else { hoursString = hoursNr + ""; }
        converted.push(hoursString);

        //format minutes
        let minutesNr: number = new Date(_booking.from).getMinutes();
        if (minutesNr < 10) { minutesString = "0" + minutesNr; } else { minutesString = minutesNr + ""; }
        converted.push(minutesString);

        return converted;
    }

    //------------------------------------------------------------------------------# START: Show total and average costs #
    /** Print accumulated prices */
    public printAccumulatedOrAveragePrice(_user: string, _booking: BookingDao[], _average: boolean) {
        let accumulatedPrice: number = 0;
        let amountBookings: number = 0;
        let averagePrice: number = 0;

        if (_user == "") {
            console.log("Log in to show your bookings.");
        } else {
            for (let i = 0; i < _booking.length; i++) {
                if (_user == _booking[i].customer) {
                    amountBookings++;
                    accumulatedPrice = accumulatedPrice + _booking[i].price;
                }
            }

            if (_average) {
                averagePrice = accumulatedPrice / amountBookings;
                console.log("The average price of all of your bookings is: " + averagePrice.toFixed(2) + "€");
            } else {
                console.log("The accumulated price of all of your bookings is: " + accumulatedPrice + "€");
            }
        }
    }
}
