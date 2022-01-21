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

    /** Search for a car and return a list of found cars */
    public async searchCar(_user: User) {
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

        if(foundCars.length==0){
            console.log("No cars were found!");
        }else{
            await this.showCarList(foundCars, _user);
        }
        
    }

    /** Prints a list of cars to the console */
    public async showCarList(_list: CarDao[], _user: User) {
        console.log("------- " + _list.length + " result/s -------");

        // If there are less than 10 cars in the list
        if (_list.length < 10) {
            for (let i = 0; i < _list.length; i++) {
                if (_list[i].type == "1") {
                    console.log(i + ": " + _list[i].model + " (E)");
                } else {
                    console.log(i + ": " + _list[i].model);
                }
            }

            // If there are more than 10 cars in the list
        } else {
            for (let i = 0; i < 10; i++) {
                if (_list[i].type == "1") {
                    console.log(i + ": " + _list[i].model + " (E)");
                } else {
                    console.log(i + ": " + _list[i].model);
                }
            }
            //Show all cars if the user wants to
            let answer: Answers<string> = await Console.waitForAnswers("Do you want to see all cars?", 'toggle');
            for (let i = 0; i < _list.length; i++) {
                if (_list[i].type == "1") {
                    console.log(i + ": " + _list[i].model + " (E)");
                } else {
                    console.log(i + ": " + _list[i].model);
                }
            }
        }
        await this.selectACar(_list, _user);
    }

    /** Select a car from a list*/
    public async selectACar(_list: CarDao[], _user: User): Promise<void> {
        let nr: Answers<string> = await Console.waitForAnswers("Enter the number of the car you want to reserve:", 'number');
        let selectedCar = _list[nr.value];
        console.log("You selected: " + selectedCar.model);
        // If selected car exists call bookACar
        if (selectedCar != undefined) {
            let booking: Booking = new Booking(selectedCar, _user);
            await booking.startBookProcess();
        }
    }

    /** Get a list of all cars */
    public async getAllCars(): Promise<CarDao[]> {
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        return cars;
    }
}