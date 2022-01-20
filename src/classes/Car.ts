import { Answers } from "prompts";
import { CarDao } from "../dao/carDao";
import { UserDao } from "../dao/userDao";
import { Booking } from "./Booking";
import Console from "./singleton/Console";
import FileHandler from "./singleton/FileHandler";
import { User } from "./User";

export class Car {

    /** Add a car to the json. Only available for administrators */
    public async addCar(): Promise<void> {
        // Ask user to input the cars properties
        let id: Answers<string> = await Console.waitForAnswers("Enter the ID:", 'text');
        // Check if the id is free
        if (await this.checkIDFree(id.value)) {
            let model: Answers<string> = await Console.waitForAnswers("Enter the model:", 'text');
            let type: Answers<string> = await Console.showOptions(["Electric", "Conventional",], "Choose a type:");
            let from: Answers<string> = await Console.waitForAnswers("Enter the earliest time:", 'text');
            let to: Answers<string> = await Console.waitForAnswers("Enter the latest time:", 'text');
            let maxDuration: Answers<string> = await Console.waitForAnswers("Enter the maximum duration in minutes", 'number');
            let price: Answers<string> = await Console.waitForAnswers("Enter the flat price:", 'number');
            let pricePerMin: Answers<string> = await Console.waitForAnswers("Enter the additional price per minute in cent:", 'number');

            // Create an object for the car
            let newCar: CarDao = { id: id.value, model: model.value, type: type.value, from: from.value, to: to.value, maxDuration: maxDuration.value, price: price.value, pricePerMin: pricePerMin.value };

            // Add the car to the JSON file
            FileHandler.writeJsonFile("./files/Cars.json", newCar);
            Console.printLine("\nAdded car to successfully.\n\n");
        } else {
            this.addCar();
        }
    }

    /** Check if the car id is unused*/
    public async checkIDFree(_id: string): Promise<boolean> {
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        for (let i: number = 0; i < cars.length; i++) {
            if (cars[i].id == _id) {
                Console.printLine("\nThis ID is already used.\n\n");
                return false;
            }
        }
        return true;
    }

    /** Show the cars in console*/
    public async printCarList(): Promise<void> {
        console.log("\nPlease make your input without the '(E)'!");
        //Save the cars from json in an array
        let carsArray: string[] = [];
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        for (let i: number = 0; i < cars.length; i++) {
            // Add (E) to the car's model to show that its an electric car
            if (cars[i].type == "1") {
                carsArray[i] = cars[i].model + " (E)";
            } else {
                carsArray[i] = cars[i].model;
            }
        }

        //Only show the first 10 cars at maximum
        if (carsArray.length < 10) {
            //Show all cars if there are less than 10 cars in total
            for (let i: number = 0; i < carsArray.length; i++) {
                console.log(carsArray[i]);
            }
        } else {
            //Show the first 10 cars
            for (let anz: number = 0; anz < 10; anz++) {
                console.log(carsArray[anz]);
            }
            let answer: Answers<string> = await Console.waitForAnswers("Do you want to see all cars?", 'toggle');
            //Show all cars if the user wants to
            if (answer.value == true) {
                for (let i: number = 0; i < carsArray.length; i++) {
                    console.log(carsArray[i]);
                }
            }
        }
    }

    /** Choose a car */
    public async chooseACar(_customer: User): Promise<void> {
        // Get the selected car and save it in a variable
        let model: Answers<string> = await Console.waitForAnswers("Enter the car you want to reserve:", 'text');
        let selectedCar = await this.getCar(model.value);
        // If selected car exists call bookACar
        if (selectedCar != undefined) {
            let booking: Booking = new Booking(selectedCar, _customer);
            await booking.startBookProcess();
        }
    }

    /** Get a car and return it*/
    public async getCar(_model: string): Promise<CarDao | undefined> {
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        for (let i: number = 0; i < cars.length; i++) {
            if (cars[i].model == _model) {
                return cars[i];
            }
        }
        return undefined;
    }


}