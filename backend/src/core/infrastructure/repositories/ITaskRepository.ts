import { Task, TaskProps, TaskStatus, TaskPriority } from '../../domain/Task';

export interface ITaskRepository {
  // Métodos básicos de CRUD
  findById(id: string): Promise<Task | null>;
  findAll(filters?: Partial<TaskProps>): Promise<Task[]>;
  create(task: TaskProps): Promise<Task>;
  update(id: string, task: Partial<TaskProps>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;

  // Métodos de consulta específicos
  findByProject(projectId: string): Promise<Task[]>;
  findByAssignee(assigneeId: string): Promise<Task[]>;
  findByCreator(createdBy: string): Promise<Task[]>;
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findByPriority(priority: TaskPriority): Promise<Task[]>;

  // Métodos avançados
  findWithFilters(filters: {
    projectId?: string;
    assigneeId?: string;
    createdBy?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    dueDateFrom?: Date;
    dueDateTo?: Date;
  }): Promise<Task[]>;

  searchTasks(searchTerm: string): Promise<Task[]>;

  // Métodos de agregação
  countByStatus(projectId?: string): Promise<Record<TaskStatus, number>>;
}