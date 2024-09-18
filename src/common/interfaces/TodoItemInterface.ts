// Define the TodoItem interface with all required fields including 'id'
export interface TodoItem {
    id: number;
    title: string;
    description: string;
    createdAt: Date;
    appUserId: string; // Assuming this is required
}

// Define the CreateTodoItem interface without 'id'
export interface CreateTodoItem {
    title: string;
    description: string;
    createdAt: Date;
    appUserId: string; // Assuming this is required
}
