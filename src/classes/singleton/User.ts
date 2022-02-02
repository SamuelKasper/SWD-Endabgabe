import { Answers } from "prompts";
import { UserDao } from "../../dao/userDao";
import checkUsername from "../../helpers/checkUsername";
import Console from "./Console";
import FileHandler from "./FileHandler";

export class User {
    //-------------------------------------------------- Singleton
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

    //-------------------------------------------------- User
    // Variable which represents the state of the user: guest, loggedIn, admin
    public accountState: string = "guest";
    public customer: string = "";

    //Register
    public async registerUser(): Promise<boolean> {
        // Ask user to input username and password
        let username: Answers<string> = await Console.waitForAnswers("Enter username:", 'text');
        let password: Answers<string> = await Console.waitForAnswers("Enter password", 'password');

        // check if username can be used
        if (await this.checkUsernameFree(username.value)) {
            if(checkUsername.checkUsernameRegExp(username.value)){
                let userObject: UserDao = { username: username.value, password: password.value };
                FileHandler.writeJsonFile("./files/User.json", userObject);
                Console.printLine("Registration successful.\n");
                return true;
            } else {
                Console.printLine("Username invalid. No special characters and only 10 characters in total allowed!\n");
            }
        }
        return false;
    }

    //Login
    public async loginUser(): Promise<boolean> {
        // Ask user to input username and password
        let username: Answers<string> = await Console.waitForAnswers("Enter username:", 'text');
        this.customer = username.value;
        let password: Answers<string> = await Console.waitForAnswers("Enter password", 'password');

        // Check if user is admin
        if (username.value == "admin" && password.value == "123") {
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

    //Check username
    private async checkUsernameFree(_username: string): Promise<boolean> {
        let users: UserDao[] = await FileHandler.readJsonFile("./files/User.json");
        // users would be null if the file couldn't be read
        for (let i: number = 0; i < users.length; i++) {
            if (users[i].username == _username) {
                Console.printLine("This username is already used.\n");
                return false;
            }
        }
        return true;
    }
}
// Export the instance of User, so you can use it in other classes
export default User.getInstance();