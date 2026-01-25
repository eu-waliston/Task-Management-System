import { Task, TaskProps, TaskStatus, TaskPriority } from "../../domain/Task";
import { ITaskRepository } from "../../application/repositories/ITaskRepository";
import { Database } from "../../../config/database";
import { logger } from "../../../config/logger";
import { NotFoundError } from "../../../api/middleware/errorHandler";
import { ObjectId } from "mongodb";

export class MongoTaskRepository implements ITaskRepository {
  private collection;

  async findByid(id: string): Promise<Task[]> {
    // This implementation assumes 'id' is unique, so returns an array with one or zero elements.
    // If your data model allows multiple tasks with the same id, adjust accordingly.
    const task = await this.findById(id);
    return task ? [task] : [];
  }

  constructor() {
    this.collection = Database.getCollection("tasks");
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const taskDoc = await this.collection.findOne({ id });

      if (taskDoc) {
        logger.debug("Task found by ID", { taskId: id });
        return this.mapToEntity(taskDoc);
      }

      logger.debug("Task not found by ID", { taskId: id });
      return null;
    } catch (error) {
      logger.error("Error finding task by ID", error as Error, { taskId: id });
      throw error;
    }
  }

  async findAll(filters?: Partial<TaskProps>): Promise<Task[]> {
    try {
      const query = this.buildQuery(filters || {});
      const taskDocs = await this.collection.find(query).toArray();

      logger.debug("Found tasks", {
        count: taskDocs.length,
        filters: Object.keys(filters || {}).length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding all tasks", error as Error, { filters });
      throw error;
    }
  }

  async findByProject(projectId: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ projectId }).toArray();

      logger.debug("Found tasks by project", {
        projectId,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks by project", error as Error, {
        projectId,
      });
      throw error;
    }
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ assigneeId }).toArray();

      logger.debug("Found tasks by assignee", {
        assigneeId,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks by assignee", error as Error, {
        assigneeId,
      });
      throw error;
    }
  }

  async findByCreator(createdBy: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ createdBy }).toArray();

      logger.debug("Found tasks by creator", {
        createdBy,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks by creator", error as Error, {
        createdBy,
      });
      throw error;
    }
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ status }).toArray();

      logger.debug("Found tasks by status", {
        status,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks by status", error as Error, { status });
      throw error;
    }
  }

  async findByPriority(priority: TaskPriority): Promise<Task[]> {
    try {
      const taskDocs = await this.collection.find({ priority }).toArray();

      logger.debug("Found tasks by priority", {
        priority,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks by priority", error as Error, {
        priority,
      });
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

      // Construir query baseada nos filtros
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

      logger.debug("Found tasks with filters", {
        filters,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks with filters", error as Error, {
        filters,
      });
      throw error;
    }
  }

  async searchTasks(searchTerm: string): Promise<Task[]> {
    try {
      const taskDocs = await this.collection
        .find({
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { tags: searchTerm },
          ],
        })
        .toArray();

      logger.debug("Tasks found by search", {
        searchTerm,
        count: taskDocs.length,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error searching tasks", error as Error, { searchTerm });
      throw error;
    }
  }

  async create(taskProps: TaskProps): Promise<Task> {
    try {
      const task = new Task(taskProps);
      const document = this.mapToDocument(task);

      await this.collection.insertOne(document);

      logger.info("Task created successfully", {
        taskId: task.id,
        title: task.title,
        createdBy: task.createdBy,
        projectId: task.projectId,
      });

      return task;
    } catch (error) {
      logger.error("Error creating task", error as Error, {
        taskProps: {
          title: taskProps.title,
          createdBy: taskProps.createdBy,
          projectId: taskProps.projectId,
        },
      });
      throw error;
    }
  }

  async update(
    id: string,
    taskProps: Partial<TaskProps>,
  ): Promise<Task | null> {
    try {
      const existingTask = await this.findById(id);
      if (!existingTask) {
        throw new NotFoundError(`Task with id ${id} not found`);
      }

      const updateData = {
        ...taskProps,
        updatedAt: new Date(),
      };

      // Remover propriedades que não devem ser atualizadas
      delete updateData.id;
      delete updateData.createdAt;

      const result = await this.collection.findOneAndUpdate(
        { id },
        { $set: updateData },
        {
          returnDocument: "after",
          includeResultMetadata: true,
        },
      );

      if (result.value) {
        logger.info("Task updated successfully", {
          taskId: id,
          updatedFields: Object.keys(taskProps),
        });
        return this.mapToEntity(result.value);
      }

      return null;
    } catch (error) {
      logger.error("Error updating task", error as Error, {
        taskId: id,
        taskProps: Object.keys(taskProps),
      });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ id });
      const deleted = result.deletedCount > 0;

      if (deleted) {
        logger.info("Task deleted successfully", { taskId: id });
      } else {
        logger.warn("Task not found for deletion", { taskId: id });
      }

      return deleted;
    } catch (error) {
      logger.error("Error deleting task", error as Error, { taskId: id });
      throw error;
    }
  }

  async countByStatus(projectId?: string): Promise<Record<TaskStatus, number>> {
    try {
      const pipeline: any[] = [];

      // Filtrar por projeto se fornecido
      if (projectId) {
        pipeline.push({ $match: { projectId } });
      }

      // Agrupar por status
      pipeline.push({
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      });

      const results = await this.collection.aggregate(pipeline).toArray();

      // Inicializar contadores
      const counts: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.REVIEW]: 0,
        [TaskStatus.DONE]: 0,
      };

      // Preencher com resultados
      results.forEach((result: any) => {
        if (result._id in counts) {
          counts[result._id as TaskStatus] = result.count;
        }
      });

      logger.debug("Task counts by status", {
        projectId,
        counts,
      });

      return counts;
    } catch (error) {
      logger.error("Error counting tasks by status", error as Error, {
        projectId,
      });
      throw error;
    }
  }

  async getStatistics(projectId?: string): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    averageCompletionTime?: number;
  }> {
    try {
      const pipeline: any[] = [];

      // Filtrar por projeto se fornecido
      if (projectId) {
        pipeline.push({ $match: { projectId } });
      }

      // Adicionar estágios de agregação para estatísticas
      pipeline.push({
        $facet: {
          total: [{ $count: "count" }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
          completedTasks: [
            { $match: { status: TaskStatus.DONE } },
            {
              $project: {
                completionTime: {
                  $divide: [
                    { $subtract: ["$updatedAt", "$createdAt"] },
                    1000 * 60 * 60, // Convert to hours
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgCompletionTime: { $avg: "$completionTime" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      });

      const [result] = await this.collection.aggregate(pipeline).toArray();

      // Processar resultados
      const total = result.total[0]?.count || 0;

      const byStatus: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.REVIEW]: 0,
        [TaskStatus.DONE]: 0,
      };

      result.byStatus.forEach((item: any) => {
        if (item._id in byStatus) {
          byStatus[item._id as TaskStatus] = item.count;
        }
      });

      const byPriority: Record<TaskPriority, number> = {
        [TaskPriority.LOW]: 0,
        [TaskPriority.MEDIUM]: 0,
        [TaskPriority.HIGH]: 0,
        [TaskPriority.URGENT]: 0,
      };

      result.byPriority.forEach((item: any) => {
        if (item._id in byPriority) {
          byPriority[item._id as TaskPriority] = item.count;
        }
      });

      const averageCompletionTime = result.completedTasks[0]?.avgCompletionTime;

      logger.debug("Task statistics retrieved", {
        projectId,
        total,
        byStatus,
        byPriority,
        averageCompletionTime,
      });

      return {
        total,
        byStatus,
        byPriority,
        averageCompletionTime,
      };
    } catch (error) {
      logger.error("Error getting task statistics", error as Error, {
        projectId,
      });
      throw error;
    }
  }

  async findOverdueTasks(): Promise<Task[]> {
    try {
      const now = new Date();
      const taskDocs = await this.collection
        .find({
          dueDate: { $lt: now },
          status: { $ne: TaskStatus.DONE },
        })
        .toArray();

      logger.debug("Found overdue tasks", {
        count: taskDocs.length,
        currentDate: now,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding overdue tasks", error as Error);
      throw error;
    }
  }

  async findTasksDueSoon(days: number = 3): Promise<Task[]> {
    try {
      const now = new Date();
      const dueDateLimit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const taskDocs = await this.collection
        .find({
          dueDate: {
            $gte: now,
            $lte: dueDateLimit,
          },
          status: { $ne: TaskStatus.DONE },
        })
        .toArray();

      logger.debug("Found tasks due soon", {
        count: taskDocs.length,
        days,
        dueDateLimit,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks due soon", error as Error, { days });
      throw error;
    }
  }

  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    try {
      const taskDocs = await this.collection
        .find({
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .toArray();

      logger.debug("Found tasks by date range", {
        count: taskDocs.length,
        startDate,
        endDate,
      });

      return taskDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      logger.error("Error finding tasks by date range", error as Error, {
        startDate,
        endDate,
      });
      throw error;
    }
  }

  async bulkUpdateStatus(
    taskIds: string[],
    status: TaskStatus,
  ): Promise<number> {
    try {
      const result = await this.collection.updateMany(
        { id: { $in: taskIds } },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
      );

      logger.info("Bulk status update completed", {
        taskCount: taskIds.length,
        updatedCount: result.modifiedCount,
        status,
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error("Error in bulk status update", error as Error, {
        taskIds,
        status,
      });
      throw error;
    }
  }

  async getTaskAssignments(userId: string): Promise<{
    assigned: Task[];
    created: Task[];
    completed: Task[];
  }> {
    try {
      const [assigned, created, completed] = await Promise.all([
        this.collection
          .find({
            assigneeId: userId,
            status: { $ne: TaskStatus.DONE },
          })
          .toArray(),
        this.collection
          .find({
            createdBy: userId,
          })
          .toArray(),
        this.collection
          .find({
            assigneeId: userId,
            status: TaskStatus.DONE,
          })
          .toArray(),
      ]);

      logger.debug("Task assignments retrieved", {
        userId,
        assignedCount: assigned.length,
        createdCount: created.length,
        completedCount: completed.length,
      });

      return {
        assigned: assigned.map((doc) => this.mapToEntity(doc)),
        created: created.map((doc) => this.mapToEntity(doc)),
        completed: completed.map((doc) => this.mapToEntity(doc)),
      };
    } catch (error) {
      logger.error("Error getting task assignments", error as Error, {
        userId,
      });
      throw error;
    }
  }

  private buildQuery(filters: Partial<TaskProps>): any {
    const query: any = {};

    if (filters.id) query.id = filters.id;
    if (filters.title) query.title = { $regex: filters.title, $options: "i" };
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.createdBy) query.createdBy = filters.createdBy;

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.dueDate) {
      query.dueDate = filters.dueDate;
    }

    if (filters.createdAt) {
      query.createdAt = filters.createdAt;
    }

    if (filters.updatedAt) {
      query.updatedAt = filters.updatedAt;
    }

    return query;
  }

  private mapToEntity(doc: any): Task {
    return new Task({
      id: doc.id,
      title: doc.title,
      description: doc.description || "",
      status: doc.status,
      priority: doc.priority,
      dueDate: doc.dueDate ? new Date(doc.dueDate) : undefined,
      assigneeId: doc.assigneeId || undefined,
      projectId: doc.projectId,
      createdBy: doc.createdBy,
      tags: doc.tags || [],
      estimatedHours: doc.estimatedHours || 1,
      actualHours: doc.actualHours || 0,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      taskDoc: doc, // Pass the original document as required by TaskProps
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
      assigneeId: task.assigneeId || null,
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
