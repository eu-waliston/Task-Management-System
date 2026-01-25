import { Task, TaskProps, TaskStatus } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../../../api/middleware/errorHandler';
import { logger } from '../../../../config/logger';

export class UpdateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository?: IUserRepository
  ) {}

  async execute(id: string, taskData: Partial<TaskProps>, requesterId?: string): Promise<Task> {
    // Verificar se a tarefa existe
    const existingTask = await this.taskRepository.findById(id);
    if (!existingTask) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    // Validar permissões (se requesterId fornecido)
    if (requesterId) {
      this.validatePermissions(existingTask, requesterId, taskData);
    }

    // Validar dados
    this.validateUpdateData(taskData);

    // Verificar se o assignee existe (se fornecido)
    if (taskData.assigneeId && this.userRepository) {
      const assignee = await this.userRepository.findById(taskData.assigneeId);
      if (!assignee) {
        throw new NotFoundError(`Assignee with id ${taskData.assigneeId} not found`);
      }
    }

    // Validar transições de status
    if (taskData.status) {
      this.validateStatusTransition(existingTask.status, taskData.status);
    }

    // Atualizar a tarefa
    const updatedTask = await this.taskRepository.update(id, taskData);

    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    logger.info('Task updated successfully', {
      taskId: id,
      updatedFields: Object.keys(taskData),
      updatedBy: requesterId,
    });

    return updatedTask;
  }

  private validatePermissions(task: Task, requesterId: string, updateData: Partial<TaskProps>): void {
    // Admin pode atualizar qualquer coisa
    // O criador da tarefa pode atualizar
    // O assignee pode atualizar apenas status
    const isAdmin = false; // Você precisaria passar o role do usuário
    const isCreator = task.createdBy === requesterId;
    const isAssignee = task.assigneeId === requesterId;

    const isUpdatingStatus = 'status' in updateData;
    const isUpdatingAssignee = 'assigneeId' in updateData;
    const isUpdatingOtherFields = Object.keys(updateData).some(
      key => !['status', 'assigneeId'].includes(key)
    );

    if (isAdmin) {
      return; // Admin tem permissão total
    }

    if (isCreator) {
      return; // Criador tem permissão total
    }

    if (isAssignee && isUpdatingStatus && !isUpdatingOtherFields && !isUpdatingAssignee) {
      return; // Assignee pode atualizar apenas o status
    }

    throw new ForbiddenError('You do not have permission to update this task');
  }

  private validateUpdateData(taskData: any): void {
    if (taskData.title && (taskData.title.length < 3 || taskData.title.length > 200)) {
      throw new ValidationError('Title must be between 3 and 200 characters');
    }

    if (taskData.description && taskData.description.length > 5000) {
      throw new ValidationError('Description must be at most 5000 characters');
    }

    if (taskData.dueDate && taskData.dueDate < new Date()) {
      throw new ValidationError('Due date cannot be in the past');
    }

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

  private validateStatusTransition(currentStatus: TaskStatus, newStatus: TaskStatus): void {
    // Definir transições válidas
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.REVIEW],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.TODO],
      [TaskStatus.REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
      [TaskStatus.DONE]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}