class Utility {
    //------------------------------------------------------------------------------# START: Singleton #
    //declare an instance of Utility
    private static instance: Utility = new Utility();

    /** if trying to create another instance throw error */
    private constructor() {
        if (Utility.instance)
            throw new Error("Instead of using new Console(), please use Console.getInstance() for Singleton!")
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


}

// Export the instance of newConsole, so you can use it in other classes
export default Utility.getInstance();