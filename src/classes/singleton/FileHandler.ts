import { readFileSync, writeFileSync } from "fs";

export class FileHandler {
  //-------------------------------------------------- Singleton section
  private static instance: FileHandler = new FileHandler();

  // If trying to create another instance of filehandler
  private constructor() {
    if (FileHandler.instance)
      throw new Error("Instead of using new FileHandler(), please use FileHandler.getInstance() for Singleton!")
    FileHandler.instance = this;
  }

  // Return the instance of the Filehandler
  public static getInstance(): FileHandler {
    return FileHandler.instance;
  }

  /** Read JSON File from given path */
  public readJsonFile(_pathToFile: string): any {
    let jsonRaw: Buffer = readFileSync(_pathToFile);
    let json: any = JSON.parse(jsonRaw.toString());
    return json;
  }

  /** Add data to a JSON file  */
  public writeJsonFile(_pathToFile: string, _dataToFile: any): void {
    let data: any[] = this.readJsonFile(_pathToFile)
    data.push(_dataToFile);
    writeFileSync(_pathToFile, JSON.stringify(data));
  }

  /** Overwrite a JSON file  */
  public overwriteJsonFile(_pathToFile: string, _dataToFile: any): void {
    writeFileSync(_pathToFile, JSON.stringify(_dataToFile));
  }

}
// Export the instance of FileHandler, so you can use it in other classes
export default FileHandler.getInstance();