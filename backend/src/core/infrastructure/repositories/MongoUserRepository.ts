import { Task, TaskProps } from '../../domain/Task';
import { ITaskRepository } from '../../application/repositories/ITaskRepository';
import { Database } from '../../../config/database';
import { NotFoundError } from '../../../api/middleware/errorHandler';

export class MongoTaskRepository implements ITaskRepository {
  private collection;

  constructor() {
    this.collection = Database.getCollection('tasks');
  }
  findByid(id: string): Promise<Task[]> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<Task | null> {
    const taskDoc = await this.collection.findOne({ id });
    return taskDoc ? new Task(taskDoc) : null;
  }

  async findAll(): Promise<Task[]> {
    const taskDocs = await this.collection.find().toArray();
    return taskDocs.map(doc => new Task(doc));
  }

  async findByProject(projectId: string): Promise<Task[]> {
    const taskDocs = await this.collection.find({ projectId }).toArray();
    return taskDocs.map(doc => new Task(doc));
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    const taskDocs = await this.collection.find({ assigneeId }).toArray();
    return taskDocs.map(doc => new Task(doc));
  }

  async findByCreator(createdBy: string): Promise<Task[]> {
    const taskDocs = await this.collection.find({ createdBy }).toArray();
    return taskDocs.map(doc => new Task(doc));
  }

  async create(taskProps: TaskProps): Promise<Task> {
    const task = new Task(taskProps);
    await this.collection.insertOne(task);
    return task;
  }

  async update(id: string, taskProps: Partial<TaskProps>): Promise<Task | null> {
    const existingTask = await this.findById(id);
    if (!existingTask) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: { ...taskProps, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    return result ? new Task(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}