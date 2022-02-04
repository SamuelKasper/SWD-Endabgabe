import { Answers } from "prompts";
import { CarDao } from "../../dao/carDao";
import Console from "./Console";
import FileHandler from "./FileHandler";

export class Car {
    //-------------------------------------------------- Singleton section
    // Declare an instance of car
    private static instance: Car = new Car();

    /** If trying to create another instance of car */
    private constructor() {
        if (Car.instance)
            throw new Error("Instead of using new Car(), please use Car.getInstance() for Singleton!")
        Car.instance = this;
    }

    /** Returns an instance of the car class */
    public static getInstance(): Car {
        return Car.instance;
    }

    //-------------------------------------------------- Car section
    /** Add a car to the json. Only available for administrators */
    public async addCar(_cars: CarDao[]): Promise<void> {
        // Get highest ID
        let idArray: number[] = [];
        for (let i = 0; i < _cars.length; i++) {
            idArray[i] = parseInt(_cars[i].id);
        }
        // Sorts the id's in ascending order
        idArray = idArray.sort(function (a, b) { return a - b });
        let id: string = idArray[idArray.length - 1] + 1 + "";
        let model: Answers<string> = await Console.waitForAnswers("Enter the model:", 'text');
        let type: Answers<string> = await Console.showOptions(["Electric", "Conventional",], "Choose a type:");
        let from: Answers<string> = await Console.waitForAnswers("Enter the earliest time:", 'text');
        let to: Answers<string> = await Console.waitForAnswers("Enter the latest time:", 'text');
        let maxDuration: Answers<string> = await Console.waitForAnswers("Enter the maximum duration in minutes", 'number');
        let price: Answers<string> = await Console.waitForAnswers("Enter the flat price:", 'number');
        let pricePerMin: Answers<string> = await Console.waitForAnswers("Enter the additional price per minute in cent:", 'number');

        // Create an object for the car
        let newCar: CarDao = { id: id, model: model.value, type: type.value, from: from.value, to: to.value, maxDuration: maxDuration.value, price: price.value, pricePerMin: pricePerMin.value };

        // Add the car to the JSON file
        FileHandler.writeJsonFile("./files/Cars.json", newCar);
        Console.printLine("\nAdded car to successfully.\n\n");
    }

    /** Search for a car and return a list of found cars */
    public async searchCar(): Promise<CarDao[]> {
        // Ask for model and drive type
        let searchString: Answers<string> = await Console.waitForAnswers("Search for a car:", 'text');
        let type: Answers<string> = await Console.showOptions(["Electronic", "Conventional",], "Select the drive type:");

        // Find cars with given properties in the json and save them
        let foundCars: CarDao[] = [];
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        for (let i: number = 0; i < cars.length; i++) {
            if (cars[i].model.includes(searchString.value)) {
                if (cars[i].type == type.value) {
                    foundCars.push(cars[i]);
                }
            }
        }
        return foundCars;
    }

    /** Prints a list of cars to the console */
    public async showCarList(_list: CarDao[]) {
        Console.printLine("------- " + _list.length + " result/s -------\n");

        // If there are less than 10 cars in the list
        if (_list.length < 10) {
            for (let i = 0; i < _list.length; i++) {
                if (_list[i].type == "1") {
                    Console.printLine(i + ": " + _list[i].model + " (E)\n");
                } else {
                    Console.printLine(i + ": " + _list[i].model + "\n");
                }
            }

            // If there are more than 10 cars in the list
        } else {
            for (let i = 0; i < 10; i++) {
                if (_list[i].type == "1") {
                    Console.printLine(i + ": " + _list[i].model + " (E)\n");
                } else {
                    Console.printLine(i + ": " + _list[i].model + "\n");
                }
            }
            //Show all cars if the user wants to
            let answer: Answers<string> = await Console.waitForAnswers("Do you want to see all cars?", 'toggle');
            if (answer.value == true) {
                Console.printLine("------- " + _list.length + " result/s -------\n");
                for (let i = 0; i < _list.length; i++) {
                    if (_list[i].type == "1") {
                        Console.printLine(i + ": " + _list[i].model + " (E)\n");
                    } else {
                        Console.printLine(i + ": " + _list[i].model + "\n");
                    }
                }
            }
        }
    }

    /** Select a car from a list*/
    public async selectACar(_list: CarDao[]): Promise<CarDao> {
        let nr: Answers<string> = await Console.waitForAnswers("Enter the number of the car you want to reserve:", 'number');
        //Check if input is valid
        if (parseInt(nr.value) > _list.length - 1 || parseInt(nr.value) < 0) {
            Console.printLine("Invalid input!\n");
            await this.selectACar(_list);
        }
        return _list[nr.value];
    }

    /** Get a list of all cars */
    public async getAllCars(): Promise<CarDao[]> {
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        return cars;
    }
}
// Export the instance of Car, so you can use it in other classes
export default Car.getInstance();