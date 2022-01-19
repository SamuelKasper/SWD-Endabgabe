import { Answers } from "prompts";
import { CarDao } from "../dao/carDao";
import Console from "./singleton/Console";
import FileHandler from "./singleton/FileHandler";

export class Car {

    public async addCar(): Promise<boolean> {
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
            let pricePerMin: Answers<string> = await Console.waitForAnswers("Enter the additional price per minute:", 'number');

            // Create an object for the car
            let newCar: CarDao = { ID: id.value, model: model.value, type: type.value, from: from.value, to: to.value, maxDuration: maxDuration.value, price: price.value, pricePerMin: pricePerMin.value };

            // Add the car to the JSON file
            FileHandler.writeJsonFile("./files/Cars.json", newCar);
            Console.printLine("\nAdded car to successfully.\n\n");
            return true;
        } else {
            return false;
        }
    }

    public async checkIDFree(_id: string): Promise<boolean> {
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        // users would be null if the file couldn't be read
        for (let i: number = 0; i < cars.length; i++) {
            if (cars[i].ID == _id) {
                Console.printLine("\nThis ID is already used.\n\n");
                return false;
            }
        }
        return true;
    }

    // Show the first 10 cars
    public async getCars(): Promise<void> {
        let carsArray: string[] = [];
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        for (let i: number = 0; i < cars.length; i++) {
            carsArray[i] = cars[i].model;
        }

        //Only show the first 10 cars at maximum
        if (carsArray.length < 10) {
            //If there is only one or less car, add "no entry" so it will be shown in console.
            for (let i: number = carsArray.length; i < 2; i++) {
                carsArray[i] = "no entry";
            }
            
            //Show all cars if there are lass than 10 cars in total
            for (let i: number = 0; i < carsArray.length; i++) {
                console.log(carsArray[i]);
            }
        } else {
            //Show the first 10 cars
            for (let anz: number = 0; anz < 10; anz++) {
                console.log(carsArray[anz]);
            }
        }
    }

    // Show all cars
    public async getAllCars(): Promise<void> {
        let carsArray: string[] = [];
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        for (let i: number = 0; i < cars.length; i++) {
            carsArray[i] = cars[i].model;
        }

        //Show all cars
        for (let anz: number = 0; anz < carsArray.length; anz++) {
            Console.printLine(carsArray[anz]);
        }
    }

    public async chooseACar(): Promise<boolean>{
        let model: Answers<string> = await Console.waitForAnswers("Enter car you want to choose:", 'text');
        //CODE
        let date: Answers<string> = await Console.waitForAnswers("Enter the date you want to use the car:", 'text');
        let time: Answers<string> = await Console.waitForAnswers("Enter the time you want to use the car:", 'text');
        let duration: Answers<string> = await Console.waitForAnswers("Enter the duration (minutes) you want to use the car", 'text');
        return true;
    }


}