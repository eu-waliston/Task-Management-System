import { Task, TaskStatus } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../../../api/middleware/errorHandler';
import { logger } from '../../../../config/logger';

export class UpdateTaskStatusUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(
    taskId: string,
    newStatus: TaskStatus,
    requesterId: string,
    comment?: string
  ): Promise<Task> {
    // Validar entrada
    this.validateInput(taskId, newStatus, requesterId);

    // Buscar tarefa
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with id ${taskId} not found`);
    }

    // Validar permissões
    this.validatePermissions(task, requesterId);

    // Validar transição de status
    this.validateStatusTransition(task.status, newStatus);

    // Atualizar status
    const updatedTask = await this.taskRepository.update(taskId, { status: newStatus });

    if (!updatedTask) {
      throw new Error('Failed to update task status');
    }

    logger.info('Task status updated', {
      taskId,
      oldStatus: task.status,
      newStatus,
      updatedBy: requesterId,
      comment,
    });

    return updatedTask;
  }

  private validateInput(taskId: string, status: TaskStatus, requesterId: string): void {
    if (!taskId) {
      throw new ValidationError('Task ID is required');
    }

    if (!status) {
      throw new ValidationError('Status is required');
    }

    if (!requesterId) {
      throw new ValidationError('Requester ID is required');
    }

    if (!Object.values(TaskStatus).includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${Object.values(TaskStatus).join(', ')}`);
    }
  }

  private validatePermissions(task: Task, requesterId: string): void {
    // O assignee pode atualizar o status
    const isAssignee = task.assigneeId === requesterId;

    // O criador pode atualizar o status
    const isCreator = task.createdBy === requesterId;

    // Admin pode atualizar qualquer coisa (simulação)
    const isAdmin = false; // Em um sistema real, você verificaria o role

    if (!isAssignee && !isCreator && !isAdmin) {
      throw new ForbiddenError('You do not have permission to update this task status');
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
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions from ${currentStatus}: ${validTransitions[currentStatus].join(', ')}`
      );
    }
  }
}