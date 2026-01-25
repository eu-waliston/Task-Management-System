import { Task } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { logger } from '../../../../config/logger';

export class GetTasksByProjectUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(projectId: string): Promise<Task[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const tasks = await this.taskRepository.findByProject(projectId);

    logger.debug('Tasks retrieved by project', {
      projectId,
      count: tasks.length,
    });

    return tasks;
  }
}