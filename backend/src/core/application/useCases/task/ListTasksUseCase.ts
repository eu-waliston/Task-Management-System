import { Task } from '../../../domain/Task';
import { ITaskRepository } from '../../repositories/ITaskRepository';
import { logger } from '../../../../config/logger';

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  createdBy?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ListTasksResult {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ListTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(
    filters: TaskFilters = {},
    pagination: PaginationOptions = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  ): Promise<ListTasksResult> {
    // Validar paginação
    this.validatePagination(pagination);

    // Aplicar filtros
    const queryFilters = this.buildQueryFilters(filters);

    // Obter todas as tarefas (para contagem total)
    const allTasks = await this.taskRepository.findWithFilters(queryFilters);
    const total = allTasks.length;

    // Calcular paginação
    const skip = (pagination.page - 1) * pagination.limit;
    const totalPages = Math.ceil(total / pagination.limit);

    // Ordenar e paginar manualmente (em um sistema real, isso seria no banco de dados)
    let tasks = [...allTasks];

    // Ordenar
    tasks.sort((a, b) => {
      const aValue = a[pagination.sortBy as keyof Task];
      const bValue = b[pagination.sortBy as keyof Task];

      if (aValue instanceof Date && bValue instanceof Date) {
        return pagination.sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return pagination.sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    // Paginar
    tasks = tasks.slice(skip, skip + pagination.limit);

    logger.debug('Tasks listed successfully', {
      filterCount: Object.keys(filters).length,
      totalTasks: total,
      returnedTasks: tasks.length,
      pagination,
    });

    return {
      tasks,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }

  private validatePagination(pagination: PaginationOptions): void {
    if (pagination.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (pagination.limit < 1 || pagination.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const validSortFields = ['createdAt', 'updatedAt', 'dueDate', 'title', 'priority', 'status'];
    if (!validSortFields.includes(pagination.sortBy)) {
      throw new Error(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`);
    }

    if (!['asc', 'desc'].includes(pagination.sortOrder)) {
      throw new Error('Sort order must be either "asc" or "desc"');
    }
  }

  private buildQueryFilters(filters: TaskFilters): any {
    const queryFilters: any = {};

    if (filters.projectId) queryFilters.projectId = filters.projectId;
    if (filters.assigneeId) queryFilters.assigneeId = filters.assigneeId;
    if (filters.createdBy) queryFilters.createdBy = filters.createdBy;
    if (filters.status) queryFilters.status = filters.status;
    if (filters.priority) queryFilters.priority = filters.priority;
    if (filters.tags && filters.tags.length > 0) {
      queryFilters.tags = { $in: filters.tags };
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      queryFilters.dueDate = {};
      if (filters.dueDateFrom) queryFilters.dueDate.$gte = filters.dueDateFrom;
      if (filters.dueDateTo) queryFilters.dueDate.$lte = filters.dueDateTo;
    }

    return queryFilters;
  }
}