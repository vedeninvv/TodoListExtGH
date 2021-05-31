import { ExtensionContext } from "vscode";

export class TaskStorage {
    private _storage: ExtensionContext;
    private static _taskStorage: TaskStorage | undefined;
    private static readonly _sizeIndex = "0";

    private constructor(storage: ExtensionContext) {
        this._storage = storage;
        let size: string | undefined = this._storage.globalState.get(TaskStorage._sizeIndex);
        if (size === undefined){
            this._storage.globalState.update(TaskStorage._sizeIndex, "0");
        }
    }

    public static create(storage: ExtensionContext) {
        if (this._taskStorage === undefined) {
            let newTaskStorage = new TaskStorage(storage);
            this._taskStorage = newTaskStorage;
            return newTaskStorage;
        } else {
            return this._taskStorage;
        }
    }

    public getSize(): string | undefined {
        return this._storage.globalState.get(TaskStorage._sizeIndex);
    }

    public writeTask(value: string) {
        let currentSize = this.getSize();
        if (currentSize !== undefined) {
            let newkey = (parseInt(currentSize) + 1).toString();
            this._storage.globalState.update(newkey, value);
            this._storage.globalState.update(TaskStorage._sizeIndex, newkey);
        }
    }

    public readAllTasks(): string[] {
        let allTasks = [];
        let currentSize = this.getSize();
        if (currentSize !== undefined) {
            let size = parseInt(currentSize);
            let currentTaskIndex = 1;
            while (currentTaskIndex <= size) {
                allTasks.push(this._storage.globalState.get(currentTaskIndex.toString()));
                currentTaskIndex++;
            }
        }
        return allTasks;
    }

    public delete(key: string) {
        let size = this.getSize();
        if (size !== undefined) {
            var previousSize = parseInt(size);
        } else{
            return;
        }
        this._storage.globalState.update(TaskStorage._sizeIndex, (previousSize - 1).toString());
        let deletedIndex = parseInt(key);
        let currentIndex = previousSize;
        let currentValue = this._storage.globalState.get(currentIndex.toString());
        while (currentIndex > deletedIndex){
            let newCurrentValue = this._storage.globalState.get((currentIndex - 1).toString());
            this._storage.globalState.update((currentIndex - 1).toString(), currentValue);
            currentValue = newCurrentValue;
            currentIndex--;
        }
    }
}