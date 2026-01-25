import { Task } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { logger } from '../../../../config/logger';

export class GetAssignedTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(assigneeId: string): Promise<Task[]> {
    if (!assigneeId) {
      throw new Error('Assignee ID is required');
    }

    const tasks = await this.taskRepository.findByAssignee(assigneeId);

    logger.debug('Tasks retrieved by assignee', {
      assigneeId,
      count: tasks.length,
    });

    return tasks;
  }
}