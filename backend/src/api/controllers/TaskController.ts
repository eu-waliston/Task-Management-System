import { Request, Response } from "express";
import { CreateTaskUseCase } from "../../core/application/useCases/task/CreateTaskUseCase";
import { GetTaskUseCase } from "../../core/application/useCases/task/GetTaskUseCase";
import { UpdateTaskUseCase } from "../../core/application/useCases/task/UpdateTaskUseCase";
import { DeleteTaskUseCase } from "../../core/application/useCases/task/DeleteTaskUseCase";
import { ListTasksUseCase } from "../../core/application/useCases/task/ListTasksUseCase";
import { GetTasksByProjectUseCase } from "../../core/application/useCases/task/GetTasksByProjectUseCase";
import { GetAssignedTasksUseCase } from "../../core/application/useCases/task/GetAssignedTasksUseCase";
import { GetCreatedTasksUseCase } from "../../core/application/useCases/task/GetCreatedTasksUseCase";
import { UpdateTaskStatusUseCase } from "../../core/application/useCases/task/UpdateTaskStatusUseCase";
import { AssignTaskUseCase } from "../../core/application/useCases/task/AssignTaskUseCase";
import { MongoTaskRepository } from "../../core/infrastructure/repositories/MongoTaskRepository";
import { AuthernticatedRequest } from "../middleware/auth";
import { UnauthorizedError, NotFoundError } from "../middleware/errorHandler";

export class TaskController {
  private createTaskUseCase: CreateTaskUseCase;
  private getTaskUseCase: GetTaskUseCase;
  private updateTaskUseCase: UpdateTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private listTasksUseCase: ListTasksUseCase;
  private getTasksByProjectUseCase: GetTasksByProjectUseCase;
  private getAssignedTasksUseCase: GetAssignedTasksUseCase;
  private getCreatedTasksUseCase: GetCreatedTasksUseCase;
  private updateTaskStatusUseCase: UpdateTaskStatusUseCase;
  private assignTaskUseCase: AssignTaskUseCase;

  constructor() {
    const taskRepository = new MongoTaskRepository();
    this.createTaskUseCase = new CreateTaskUseCase(taskRepository);
    this.getTaskUseCase = new GetTaskUseCase(taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
    this.listTasksUseCase = new ListTasksUseCase(taskRepository);
    this.getTasksByProjectUseCase = new GetTasksByProjectUseCase(
      taskRepository,
    );
    this.getAssignedTasksUseCase = new GetAssignedTasksUseCase(taskRepository);
    this.getCreatedTasksUseCase = new GetCreatedTasksUseCase(taskRepository);
    this.updateTaskStatusUseCase = new UpdateTaskStatusUseCase(taskRepository);
    this.assignTaskUseCase = new AssignTaskUseCase(taskRepository);
  }

  getAllTasks = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const tasks = await this.listTasksUseCase.execute();
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getTaskById = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const task = await this.getTaskUseCase.execute(id);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getTasksByProject = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { projectId } = req.params;
      const tasks = await this.getTasksByProjectUseCase.execute(projectId);
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getAssignedTasks = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const tasks = await this.getAssignedTasksUseCase.execute(req.user.id);
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getCreatedTasks = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const tasks = await this.getCreatedTasksUseCase.execute(req.user.id);
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  createTask = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const taskData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const task = await this.createTaskUseCase.execute(taskData);
      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateTask = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Verificar permissões (implementação básica)
      const task = await this.getTaskUseCase.execute(id);
      if (
        !req.user ||
        (req.user.role !== "admin" &&
          req.user.role !== "manager" &&
          task.createdBy !== req.user.id)
      ) {
        throw new UnauthorizedError(
          "You do not have permission to update this task",
        );
      }

      const updatedTask = await this.updateTaskUseCase.execute(id, req.body);
      res.status(200).json({
        success: true,
        data: updatedTask,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateTaskStatus = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const updatedTask = await this.updateTaskStatusUseCase.execute(
        id,
        status,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: updatedTask,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  assignTask = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;

      const updatedTask = await this.assignTaskUseCase.execute(id, assigneeId);
      res.status(200).json({
        success: true,
        data: updatedTask,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  deleteTask = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.deleteTaskUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };
}
