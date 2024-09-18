import { makeAutoObservable, runInAction } from "mobx";
import { CreateTodoItem, TodoItem } from "../common/interfaces/TodoItemInterface";
import agent from "../api/agent";
import * as signalR from "@microsoft/signalr";
import { userInfo } from "os";

export default class TodoItemStore {
    todoItems: TodoItem[] = [];
    selectedTodo: TodoItem | null = null;
    loading = false;
    loadingInitial = false;
    private hubConnection: signalR.HubConnection | null = null;

    constructor() {
        makeAutoObservable(this);
        this.initializeSignalRConnection();
    }

    private initializeSignalRConnection = () => {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_APP_API_URL + "/todoHub") // Update with your hub URL
            .withAutomaticReconnect()
            .build();
    
        this.hubConnection.on("ReceiveTodoUpdate", (id: number, title: string, description: string, createdAt: Date, appUserId: string) => {
            runInAction(() => {
                const updatedItem = this.todoItems.find(item => item.id === id);
                if (updatedItem) {
                    updatedItem.title = title;
                    updatedItem.description = description;
                    updatedItem.createdAt = new Date(createdAt); // Ensure createdAt is updated
                    updatedItem.appUserId = appUserId; // Update appUserId if needed
                } else {
                    // Handle newly created item with appUserId
                    this.todoItems.push({ id, title, description, createdAt: new Date(createdAt), appUserId });
                }
            });
        });
    
        this.hubConnection.start().catch(err => console.error("SignalR Connection Error: ", err));
    };
    
    loadTodoItems = async () => {
        this.loadingInitial = true;
        try {
            const todoItems = await agent.TodoItemsRequests.getAll();
            runInAction(() => {
                this.todoItems = todoItems;
                this.loadingInitial = false;
            });
        } catch (error) {
            console.log(error);
            runInAction(() => {
                this.loadingInitial = false;
            });
        }
    };

    loadTodoItem = async (id: number) => {
        this.loading = true;
        try {
            const todoItem = await agent.TodoItemsRequests.getById(id);
            runInAction(() => {
                this.selectedTodo = todoItem;
                this.loading = false;
            });
        } catch (error) {
            console.log(error);
            runInAction(() => {
                this.loading = false;
            });
        }
    };

    createTodoItem = async (todoItem: CreateTodoItem) => {
        this.loading = true;
        try {
            const createdItem = await agent.TodoItemsRequests.create(todoItem); // Assuming the server returns a TodoItem
            runInAction(() => {
                this.todoItems.push(createdItem); // Created item will include 'id'
                this.loading = false;
            });
        } catch (error) {
            console.log(error);
            runInAction(() => {
                this.loading = false;
            });
        }
    };
    
    

    updateTodoItem = async (todoItem: TodoItem) => {
        this.loading = true;
        try {
            await agent.TodoItemsRequests.update(todoItem.id, todoItem);
            runInAction(() => {
                this.todoItems = this.todoItems.map(item =>
                    item.id === todoItem.id ? todoItem : item
                );
                this.selectedTodo = todoItem;
                this.loading = false;
            });
        } catch (error) {
            console.log(error);
            runInAction(() => {
                this.loading = false;
            });
        }
    };

    deleteTodoItem = async (id: number) => {
        this.loading = true;
        try {
            await agent.TodoItemsRequests.delete(id);
            runInAction(() => {
                this.todoItems = this.todoItems.filter(item => item.id !== id);
                this.loading = false;
            });
        } catch (error) {
            console.log(error);
            runInAction(() => {
                this.loading = false;
            });
        }
    };
}

