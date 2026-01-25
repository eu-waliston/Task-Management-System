import { Task } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { NotFoundError } from '../../../../api/middleware/errorHandler';
import { logger } from '../../../../config/logger';

export class GetTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(id: string): Promise<Task> {
    if (!id) {
      throw new Error('Task ID is required');
    }

    const task = await this.taskRepository.findById(id);

    if (!task) {
      logger.warn('Task not found', { taskId: id });
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    logger.debug('Task retrieved successfully', { taskId: id });
    return task;
  }
}