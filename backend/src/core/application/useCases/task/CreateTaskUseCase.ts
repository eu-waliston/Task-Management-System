import { Task, TaskProps } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../../../api/middleware/errorHandler';
import { logger } from '../../../../config/logger';

export class CreateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository?: IUserRepository
  ) {}

  async execute(taskData: Omit<TaskProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    // Validar dados
    this.validateTaskData(taskData);

    // Verificar se o usuário criador existe
    if (this.userRepository) {
      const creator = await this.userRepository.findById(taskData.createdBy);
      if (!creator) {
        throw new NotFoundError(`Creator with id ${taskData.createdBy} not found`);
      }
    }

    // Verificar se o assignee existe (se fornecido)
    if (taskData.assigneeId && this.userRepository) {
      const assignee = await this.userRepository.findById(taskData.assigneeId);
      if (!assignee) {
        throw new NotFoundError(`Assignee with id ${taskData.assigneeId} not found`);
      }
    }

    // Verificar data de vencimento
    if (taskData.dueDate && taskData.dueDate < new Date()) {
      throw new ValidationError('Due date cannot be in the past');
    }

    // Criar a tarefa
    const task = await this.taskRepository.create(taskData);

    logger.info('Task created successfully', {
      taskId: task.id,
      title: task.title,
      createdBy: task.createdBy,
      assigneeId: task.assigneeId,
    });

    return task;
  }

  private validateTaskData(taskData: any): void {
    const { title, description, projectId, createdBy } = taskData;

    if (!title || !projectId || !createdBy) {
      throw new ValidationError('Title, projectId, and createdBy are required');
    }

    if (title.length < 3 || title.length > 200) {
      throw new ValidationError('Title must be between 3 and 200 characters');
    }

    if (description && description.length > 5000) {
      throw new ValidationError('Description must be at most 5000 characters');
    }

    // Validar tags
    if (taskData.tags && Array.isArray(taskData.tags)) {
      if (taskData.tags.length > 10) {
        throw new ValidationError('Maximum 10 tags allowed');
      }

      taskData.tags.forEach((tag: string, index: number) => {
        if (tag.length > 50) {
          throw new ValidationError(`Tag at position ${index} must be at most 50 characters`);
        }
      });
    }
  }
}