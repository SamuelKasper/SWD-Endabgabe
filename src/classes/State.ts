export class State{
    private accountState: string;

    constructor(){
        this.accountState = "guest";
    }

    public setState(_state: string){
        this.accountState = _state;
    }

    public getState(): string{
        return this.accountState;
    }
}