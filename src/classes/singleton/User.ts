import { Answers } from "prompts";
import { UserDao } from "../../dao/userDao";
import checkUsername from "../../helpers/checkUsername";
import Console from "./Console";
import FileHandler from "./FileHandler";
import Utility from "./Utility";

export class User {
    //-------------------------------------------------- Singleton section
    // Declare an instance of user
    private static instance: User = new User();

    /** If trying to create another instance of user */
    private constructor() {
        if (User.instance)
            throw new Error("Instead of using new User(), please use User.getInstance() for Singleton!")
        User.instance = this;
    }

    /** Returns an instance of the user class */
    public static getInstance(): User {
        return User.instance;
    }

    //-------------------------------------------------- User section
    // Variable which represents the state of the user: guest, loggedIn, admin
    public accountState: string = "guest";
    public username: string = "";

    /** Register a user and write the user to JSON */
    public async registerUser(): Promise<boolean> {
        // Generate the next ID. If there is no user, set the first id = 0
        let users: UserDao[] = await this.getAllUsers();
        let idArray: number[] = [];
        let id: number;
        if (users.length > 0) {
            for (let i = 0; i < users.length; i++) {
                idArray[i] = users[i].id;
            }
            id = Utility.generateNextID(idArray);
        }else{
            id = 0;
        }

        // Ask user to input username and password
        let username: Answers<string> = await Console.waitForAnswers("Enter username:", 'text');
        let password: Answers<string> = await Console.waitForAnswers("Enter password", 'password');

        // check if username can be used
        if (await this.checkUsernameFree(username.value)) {
            if (checkUsername.checkUsernameRegExp(username.value)) {
                let userObject: UserDao = { id: id, username: username.value, password: password.value };
                FileHandler.writeJsonFile("./files/User.json", userObject);
                Console.printLine("Registration successful.\n");
                return true;
            } else {
                Console.printLine("Username invalid. No special characters and only 10 characters in total allowed!\n");
            }
        }
        return false;
    }

    /** Login */
    public async loginUser(): Promise<boolean> {
        // Ask user to input username and password
        let username: Answers<string> = await Console.waitForAnswers("Enter username:", 'text');
        this.username = username.value;
        let password: Answers<string> = await Console.waitForAnswers("Enter password", 'password');

        // Check if user is admin
        if (username.value == "admin" && password.value == "admin") {
            this.accountState = "admin";
            Console.printLine("Logged in as admin.\n");
            return true;
        }

        // If user is not admin
        let users: UserDao[] = await FileHandler.readJsonFile("./files/User.json");
        for (let i: number = 0; i < users.length; i++) {
            if (users[i].username == username.value && users[i].password == password.value) {
                this.accountState = "loggedIn";
                Console.printLine("Login successful.\n");
                return true;
            }
        }
        Console.printLine("Username of password wrong.\n");
        return false;
    }

    /** Check username */
    private async checkUsernameFree(_username: string): Promise<boolean> {
        //let users: UserDao[] = await FileHandler.readJsonFile("./files/User.json");
        let users: UserDao[] = await this.getAllUsers();
        for (let i: number = 0; i < users.length; i++) {
            if (users[i].username == _username) {
                Console.printLine("This username is already used.\n");
                return false;
            }
        }
        return true;
    }

    /** Returns all Users */
    private async getAllUsers(): Promise<UserDao[]> {
        let users: UserDao[] = await FileHandler.readJsonFile("./files/User.json");
        return users;
    }
}
// Export the instance of User, so you can use it in other classes
export default User.getInstance();