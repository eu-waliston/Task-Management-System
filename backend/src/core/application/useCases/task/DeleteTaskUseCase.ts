import { ITaskRepository } from '../../repositories/ITaskRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { NotFoundError, ForbiddenError } from '../../../../api/middleware/errorHandler';
import { logger } from '../../../../config/logger';

export class DeleteTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository?: IUserRepository
  ) {}

  async execute(id: string, requesterId?: string, requesterRole?: string): Promise<boolean> {
    // Verificar se a tarefa existe
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    // Validar permissões (se requesterId fornecido)
    if (requesterId) {
      this.validatePermissions(task, requesterId, requesterRole);
    }

    // Deletar a tarefa
    const result = await this.taskRepository.delete(id);

    if (result) {
      logger.info('Task deleted successfully', {
        taskId: id,
        deletedBy: requesterId,
      });
    }

    return result;
  }

  private validatePermissions(task: any, requesterId: string, requesterRole?: string): void {
    // Admin pode deletar qualquer tarefa
    const isAdmin = requesterRole === 'admin';

    // O criador pode deletar suas próprias tarefas
    const isCreator = task.createdBy === requesterId;

    if (!isAdmin && !isCreator) {
      throw new ForbiddenError('You do not have permission to delete this task');
    }
  }
}