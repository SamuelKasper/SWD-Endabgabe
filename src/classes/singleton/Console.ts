import readline from 'readline';
import prompts, { Answers, PromptType } from 'prompts';

class Console {
    //-------------------------------------------------- Singleton section
    // Declare an instance of Console
    private static instance: Console = new Console();

    /** If trying to create another instance of Console */
    private constructor() {
        if (Console.instance)
            throw new Error("Instead of using new Console(), please use Console.getInstance() for Singleton!")
        Console.instance = this;
    }

    /** Returns an instance of the Console class */
    public static getInstance(): Console {
        return Console.instance;
    }

    //-------------------------------------------------- Terminal output section
    public consoleLine: readline.ReadLine = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    /** Print the given String in the console */
    public printLine(line: string): void {
        this.consoleLine.write(line);
    }

    //-------------------------------------------------- Terminal section
    // Function for showing the given parameters in Terminal
    public showOptions(_option: string[], _question: string): Promise<Answers<string>> {
        let choices: any[] = []

        for (let i: number = 1; i <= _option.length; i++) {
            choices.push({ title: _option[i - 1], value: i })
        }
        return prompts({
            type: 'select',
            name: 'value',
            message: _question,
            choices: choices,
            initial: 1
        })
    }

    // Function for setting questions or answers
    public waitForAnswers(_question: string, _type: PromptType): Promise<Answers<string>> {
        return prompts({
            type: _type,
            name: 'value',
            message: _question,
            initial: 1,
            active: 'yes',
            inactive: 'no'
        })
    }

    // Function for setting dates
    public waitForDate(_question: string): Promise<Answers<string>> {
        return prompts({
            type: 'date',
            name: 'value',
            message: _question,
            initial: new Date(),
            mask: "YYYY-MM-DD HH:mm",
            validate: date => date < Date.now() ? 'You can only use future dates!' : true
        })
    }
}
// Export the instance of Console, so you can use it in other classes
export default Console.getInstance();