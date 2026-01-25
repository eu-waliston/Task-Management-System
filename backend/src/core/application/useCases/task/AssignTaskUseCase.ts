import { Task } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../../../../api/middleware/errorHandler';
import { logger } from '../../../../config/logger';

export class AssignTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository?: IUserRepository
  ) {}

  async execute(taskId: string, assigneeId: string, notify: boolean = true): Promise<Task> {
    // Validar entrada
    this.validateInput(taskId, assigneeId);

    // Verificar se a tarefa existe
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with id ${taskId} not found`);
    }

    // Verificar se o assignee existe
    if (this.userRepository) {
      const assignee = await this.userRepository.findById(assigneeId);
      if (!assignee) {
        throw new NotFoundError(`Assignee with id ${assigneeId} not found`);
      }
    }

    // Verificar se a tarefa já está atribuída ao mesmo usuário
    if (task.assigneeId === assigneeId) {
      logger.warn('Task already assigned to this user', { taskId, assigneeId });
      return task;
    }

    // Atribuir tarefa
    const updatedTask = await this.taskRepository.update(taskId, { assigneeId });

    if (!updatedTask) {
      throw new Error('Failed to assign task');
    }

    logger.info('Task assigned successfully', {
      taskId,
      previousAssignee: task.assigneeId,
      newAssignee: assigneeId,
      notify,
    });

    // Aqui você poderia enviar uma notificação
    if (notify && this.userRepository) {
      await this.sendAssignmentNotification(task, assigneeId);
    }

    return updatedTask;
  }

  private validateInput(taskId: string, assigneeId: string): void {
    if (!taskId) {
      throw new ValidationError('Task ID is required');
    }

    if (!assigneeId) {
      throw new ValidationError('Assignee ID is required');
    }
  }

  private async sendAssignmentNotification(task: Task, assigneeId: string): Promise<void> {
    try {
      // Em um sistema real, isso enviaria uma notificação
      // por email, push notification, etc.

      if (this.userRepository) {
        const assignee = await this.userRepository.findById(assigneeId);
        if (assignee) {
          logger.info('Assignment notification would be sent', {
            taskId: task.id,
            taskTitle: task.title,
            assigneeEmail: assignee.email,
            assigneeName: assignee.fullName,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send assignment notification', error as Error, {
        taskId: task.id,
        assigneeId,
      });
      // Não lançar erro para não quebrar o fluxo principal
    }
  }
}