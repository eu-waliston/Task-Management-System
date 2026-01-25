import { Request, Response, NextFunction } from 'express';
import { taskFilterSchema, buildTaskQueryFromFilters, buildSortOptions, buildPagination } from '../validators/taskValidators';
import { ValidationError } from './errorHandler';
import { logger } from '../../config/logger';
import { TaskStatus, TaskPriority } from '../../core/domain/Task';

export const processTaskFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse e validar os query params
    const filters = taskFilterSchema.parse(req.query);

    // Construir query MongoDB
    const query = buildTaskQueryFromFilters(filters);

    // Construir opções de ordenação
    const sort = buildSortOptions(filters);

    // Construir opções de paginação
    const pagination = buildPagination(filters);

    // Adicionar ao request para uso nos controllers
    req.taskFilters = {
      query,
      sort,
      pagination,
      originalFilters: filters,
    };

    logger.debug('Task filters processed successfully', {
      filterCount: Object.keys(filters).length,
      query: JSON.stringify(query),
      sort,
      pagination,
    });

    next();
  } catch (error) {
    logger.error('Error processing task filters', error as Error, { query: req.query });
    next(error);
  }
};

// Declaração de tipos para o request
declare global {
  namespace Express {
    interface Request {
      taskFilters?: {
        query: any;
        sort: any;
        pagination: {
          skip: number;
          limit: number;
        };
        originalFilters: any;
      };
    }
  }
}

// Middleware para validar permissões de filtro
export const validateFilterPermissions = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.taskFilters) {
      return next();
    }

    const filters = req.taskFilters.originalFilters;
    const user = (req as any).user; // Assume que o usuário está no request

    // Verificar se o usuário está tentando filtrar por campos não permitidos
    const filteredFields = Object.keys(filters).filter(key =>
      !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
    );

    const unauthorizedFields = filteredFields.filter(field =>
      !allowedFields.includes(field)
    );

    if (unauthorizedFields.length > 0) {
      // Se for admin, permite todos os campos
      if (user?.role === 'admin') {
        return next();
      }

      // Verificar se está tentando filtrar tarefas de outros usuários
      if (!user) {
        throw new ValidationError('Authentication required for filtering');
      }

      if (filters.assigneeId && filters.assigneeId !== user.id && user.role !== 'admin') {
        throw new ValidationError('You can only filter your own assigned tasks');
      }

      if (filters.createdBy && filters.createdBy !== user.id && user.role !== 'admin') {
        throw new ValidationError('You can only filter tasks you created');
      }
    }

    next();
  };
};

// Helper para criar filtros padrão baseados no usuário
export const createDefaultFilters = (req: Request) => {
  const user = (req as any).user;

  if (!user) {
    return {};
  }

  const defaultFilters: any = {};

  // Para usuários não-admin, mostrar apenas suas tarefas ou tarefas não atribuídas
  if (user.role !== 'admin') {
    defaultFilters.$or = [
      { assigneeId: user.id },
      { createdBy: user.id },
      { assigneeId: { $exists: false } }
    ];
  }

  return defaultFilters;
};

// Middleware para mesclar filtros padrão com filtros do usuário
export const mergeTaskFilters = (req: Request, res: Response, next: NextFunction) => {
  if (!req.taskFilters) {
    return next();
  }

  const defaultFilters = createDefaultFilters(req);

  // Mesclar filtros padrão com filtros do usuário
  if (Object.keys(defaultFilters).length > 0) {
    if (req.taskFilters.query.$or) {
      // Se já existir $or, mesclar com $and
      req.taskFilters.query = {
        $and: [
          req.taskFilters.query,
          defaultFilters
        ]
      };
    } else {
      // Caso contrário, usar $and para combinar
      req.taskFilters.query = {
        $and: [
          req.taskFilters.query,
          defaultFilters
        ]
      };
    }
  }

  logger.debug('Task filters merged with defaults', {
    defaultFilterKeys: Object.keys(defaultFilters),
    finalQuery: JSON.stringify(req.taskFilters.query),
  });

  next();
};

// Helper para formatar resposta paginada
export const formatPaginationResponse = (
  data: any[],
  total: number,
  filters: any,
  extra?: Record<string, any>
) => {
  const totalPages = Math.ceil(total / filters.limit);
  const hasNext = filters.page < totalPages;
  const hasPrev = filters.page > 1;

  return {
    success: true,
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? filters.page + 1 : null,
      prevPage: hasPrev ? filters.page - 1 : null,
    },
    filters: {
      applied: Object.keys(filters).filter(key =>
        !['page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key] !== undefined
      ),
      ...extra,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};

// Helper para validar parâmetros de filtro específicos
export const validateSpecificFilter = (field: string, allowedValues: any[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.query[field];

    if (value && !allowedValues.includes(value)) {
      throw new ValidationError(
        `Invalid value for ${field}. Allowed values: ${allowedValues.join(', ')}`
      );
    }

    next();
  };
};

// Validadores específicos
export const validateStatusFilter = validateSpecificFilter('status', Object.values(TaskStatus));
export const validatePriorityFilter = validateSpecificFilter('priority', Object.values(TaskPriority));