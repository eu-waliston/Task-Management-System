import { Task } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { logger } from '../../../../config/logger';

export class GetCreatedTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(createdBy: string): Promise<Task[]> {
    if (!createdBy) {
      throw new Error('Creator ID is required');
    }

    const tasks = await this.taskRepository.findByCreator(createdBy);

    logger.debug('Tasks retrieved by creator', {
      createdBy,
      count: tasks.length,
    });

    return tasks;
  }
}