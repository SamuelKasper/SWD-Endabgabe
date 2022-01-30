import { Answers } from "prompts";
import { BookingDao } from "../../dao/bookingDao";
import Console from "./Console";

class Utility {
    //------------------------------------------------------------------------------# START: Singleton #
    //declare an instance of Utility
    private static instance: Utility = new Utility();

    /** if trying to create another instance throw error */
    private constructor() {
        if (Utility.instance)
            throw new Error("Instead of using new Utility(), please use Utility.getInstance() for Singleton!")
        Utility.instance = this;
    }

    /** Returns an instance of the utility class */
    public static getInstance(): Utility {
        return Utility.instance;
    }

    //------------------------------------------------------------------------------# START: Functions #    
    /** Returns the requested- and booking- Date with duration in ms*/
    public convertInMs(_bookingDateAsNumber: number, _requestedDateAsNumber: number, _requestedDuration: number, _bookingDuration: number): number[] {
        let convertedValues: number[] = []
        convertedValues[0] = _requestedDateAsNumber + _requestedDuration * 60 * 1000;
        convertedValues[1] = _bookingDateAsNumber + _bookingDuration * 60 * 1000;
        return convertedValues;
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

    /** Print accumulated and average prices */
    public printAccumulatedOrAveragePrice(_user: string, _booking: BookingDao[], _average: boolean) {
        let accumulatedPrice: number = 0;
        let amountBookings: number = 0;
        let averagePrice: number = 0;

        if (_user == "") {
            Console.printLine("Log in to show your bookings.\n");
        } else {
            for (let i = 0; i < _booking.length; i++) {
                if (_user == _booking[i].customer) {
                    amountBookings++;
                    accumulatedPrice = accumulatedPrice + _booking[i].price;
                }
            }

            if (_average) {
                averagePrice = accumulatedPrice / amountBookings;
                Console.printLine("The average price of all of your bookings is: " + averagePrice.toFixed(2) + "€.\n");
            } else {
                Console.printLine("The accumulated price of all of your bookings is: " + accumulatedPrice + "€.\n");
            }
        }
    }
}

// Export the instance of newConsole, so you can use it in other classes
export default Utility.getInstance();