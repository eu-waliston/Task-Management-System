import { Task, TaskProps } from "../../domain/Task";

export interface ITaskRepository {
    [x: string]: any;
    findByid(id: string): Promise<Task[]>;
    findAll(): Promise<Task[]>;
    findByProject(projectId: string): Promise<Task[]>;
    findByAssignee(assigneeId: string): Promise<Task[]>;
    create(task: TaskProps): Promise<Task>;
    update(id: string, task: Partial<TaskProps>): Promise<Task | null>;
    delete(id: string): Promise<boolean>;
}