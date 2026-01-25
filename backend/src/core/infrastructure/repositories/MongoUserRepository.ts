import { Task, TaskProps, TaskStatus, TaskPriority } from '../../domain/Task';
import { ITaskRepository } from '../../application/repositories/ITaskRepository';
import { Database } from '../../../config/database';
import { logger } from '../../../config/logger';
import { NotFoundError } from '../../../api/middleware/errorHandler';

export class MongoTaskRepository implements ITaskRepository {
  private collection;

  constructor() {
    this.collection = Database.getCollection('tasks');
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const taskDoc = await this.collection.findOne({ id });

      if (taskDoc) {
        logger.debug('Task found by ID', { taskId: id });
        return this.mapToEntity(taskDoc);
      }

      logger.debug('Task not found by ID', { taskId: id });
      return null;
    } catch (error) {
      logger.error('Error finding task by ID', error as Error, { taskId: id });
      throw error;
    }
  }

  async findAll(filters?: Partial<TaskProps>): Promise<Task[]> {
    try {
      const query = filters || {};
      const taskDocs = await this.collection.find(query).toArray();

      logger.debug('Found tasks', { count: taskDocs.length, filters });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding all tasks', error as Error, { filters });
      throw error;
    }
  }

  async findByProject(projectId: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ projectId }).toArray();

      logger.debug('Found tasks by project', { projectId, count: taskDocs.length });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks by project', error as Error, { projectId });
      throw error;
    }
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ assigneeId }).toArray();

      logger.debug('Found tasks by assignee', { assigneeId, count: taskDocs.length });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks by assignee', error as Error, { assigneeId });
      throw error;
    }
  }

  async findByid(id: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ id }).toArray();

      logger.debug('Found tasks by id (findByid)', { id, count: taskDocs.length });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks by id (findByid)', error as Error, { id });
      throw error;
    }
  }

  async findByCreator(createdBy: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ createdBy }).toArray();

      logger.debug('Found tasks by creator', { createdBy, count: taskDocs.length });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks by creator', error as Error, { createdBy });
      throw error;
    }
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ status }).toArray();

      logger.debug('Found tasks by status', { status, count: taskDocs.length });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks by status', error as Error, { status });
      throw error;
    }
  }

  async findByPriority(priority: TaskPriority): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ priority }).toArray();

      logger.debug('Found tasks by priority', { priority, count: taskDocs.length });
      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks by priority', error as Error, { priority });
      throw error;
    }
  }

  async findWithFilters(filters: {
    projectId?: string;
    assigneeId?: string;
    createdBy?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    dueDateFrom?: Date;
    dueDateTo?: Date;
  }): Promise<Task[]> {
    try {
      const query: any = {};

      if (filters.projectId) query.projectId = filters.projectId;
      if (filters.assigneeId) query.assigneeId = filters.assigneeId;
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.dueDateFrom || filters.dueDateTo) {
        query.dueDate = {};
        if (filters.dueDateFrom) query.dueDate.$gte = filters.dueDateFrom;
        if (filters.dueDateTo) query.dueDate.$lte = filters.dueDateTo;
      }

      const taskDocs = await this.collection.find(query).toArray();

      logger.debug('Found tasks with filters', {
        filters,
        count: taskDocs.length
      });

      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding tasks with filters', error as Error, { filters });
      throw error;
    }
  }

  async create(taskProps: TaskProps): Promise<Task> {
    try {
      const task = new Task(taskProps);
      await this.collection.insertOne(this.mapToDocument(task));

      logger.info('Task created successfully', {
        taskId: task.id,
        title: task.title,
        createdBy: task.createdBy,
      });

      return task;
    } catch (error) {
      logger.error('Error creating task', error as Error, { taskProps });
      throw error;
    }
  }

  async update(id: string, taskProps: Partial<TaskProps>): Promise<Task | null> {
    try {
      const existingTask = await this.findById(id);
      if (!existingTask) {
        throw new NotFoundError(`Task with id ${id} not found`);
      }

      const updateData = {
        ...taskProps,
        updatedAt: new Date(),
      };

      const result = await this.collection.findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        logger.info('Task updated successfully', {
          taskId: id,
          updatedFields: Object.keys(taskProps),
        });
        return this.mapToEntity(result);
      }

      return null;
    } catch (error) {
      logger.error('Error updating task', error as Error, { taskId: id, taskProps });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ id });
      const deleted = result.deletedCount > 0;

      if (deleted) {
        logger.info('Task deleted successfully', { taskId: id });
      } else {
        logger.warn('Task not found for deletion', { taskId: id });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting task', error as Error, { taskId: id });
      throw error;
    }
  }

  async countByStatus(projectId?: string): Promise<Record<TaskStatus, number>> {
    try {
      const pipeline: any[] = [];

      if (projectId) {
        pipeline.push({ $match: { projectId } });
      }

      pipeline.push(
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        } }
      );

      const results = await this.collection.aggregate(pipeline).toArray();

      const counts: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.REVIEW]: 0,
        [TaskStatus.DONE]: 0,
      };

      results.forEach(result => {
        if (Object.values(TaskStatus).includes(result._id)) {
          counts[result._id as TaskStatus] = result.count;
        }
      });

      logger.debug('Task counts by status', { projectId, counts });
      return counts;
    } catch (error) {
      logger.error('Error counting tasks by status', error as Error, { projectId });
      throw error;
    }
  }

  async searchTasks(searchTerm: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: searchTerm }
        ]
      }).toArray();

      logger.debug('Tasks found by search', {
        searchTerm,
        count: taskDocs.length
      });

      return taskDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error searching tasks', error as Error, { searchTerm });
      throw error;
    }
  }

  private mapToEntity(doc: any): Task {
    return new Task({
      taskDoc: doc,
      id: doc.id,
      title: doc.title,
      description: doc.description,
      status: doc.status,
      priority: doc.priority,
      dueDate: doc.dueDate ? new Date(doc.dueDate) : undefined,
      assigneeId: doc.assigneeId,
      projectId: doc.projectId,
      createdBy: doc.createdBy,
      tags: doc.tags || [],
      estimatedHours: doc.estimatedHours,
      actualHours: doc.actualHours,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  private mapToDocument(task: Task): any {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      projectId: task.projectId,
      createdBy: task.createdBy,
      tags: task.tags,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}