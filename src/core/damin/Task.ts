import { v4 as uuidv4 } from 'uuid';

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    REVIEW = 'review',
    DONE = 'done'
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export interface TaskProps {
    id?: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Date;
    assigneeId?: string;
    projectId: string;
    createdBy: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export class Task {
    public readonly id: string;
    public readonly title: string;
    public readonly description: string;
    public readonly status: TaskStatus;
    public readonly priority: TaskPriority;
    public readonly dueDate?: Date;
    public readonly assigneeId?: string;
    public readonly projectId: string;
    public readonly createdBy: string;
    public readonly tags: string[];
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: TaskProps) {
        this.id = props.id || uuidv4();
        this.title = props.title;
        this.description = props.description;
        this.status = props.status;
        this.priority = props.priority;
        this.dueDate = props.dueDate;
        this.assigneeId = props.assigneeId;
        this.projectId = props.projectId;
        this.createdBy = props.createdBy;
        this.tags = props.tags || [];
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
    }

    public update(props: Partial<TaskProps>): Task {
        return new Task({
            ...this,
            ...props,
            updatedAt: new Date()
        });
    }

    public changeSatus(status: TaskStatus): Task {
        return this.update({ status })
    }

    public assignTo(userId: string): Task {
        return this.update({ assigneeId: userId });
    }
}