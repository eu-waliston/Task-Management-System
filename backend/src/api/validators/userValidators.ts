import { z } from 'zod';
import { UserRole } from '../../core/domain/User';

// Schema para criação de usuário
export const userCreateSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be at most 100 characters')
    .transform(email => email.toLowerCase().trim()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),

  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name can only contain letters, spaces, hyphens and apostrophes'),

  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name can only contain letters, spaces, hyphens and apostrophes'),

  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(UserRole).join(', ')}` })
  }),

  isActive: z.boolean().optional().default(true),
});


// Schema para atualização de usuário (todos os campos opcionais)
export const userUpdateSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be at most 100 characters')
    .transform(email => email.toLowerCase().trim())
    .optional(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    )
    .optional(),

  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name can only contain letters, spaces, hyphens and apostrophes')
    .optional(),

  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name can only contain letters, spaces, hyphens and apostrophes')
    .optional(),

  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(UserRole).join(', ')}` })
  }).optional(),

  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Schema para login de usuário
export const userLoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .transform(email => email.toLowerCase().trim()),

  password: z.string()
    .min(1, 'Password is required'),
});

// Schema para alteração de senha
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),

  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),

  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Schema para reset de senha
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),

  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),

  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const taskCreateSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()\[\]]+$/, 'Title contains invalid characters'),

  description: z.string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .default(''),

  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    })
  }).default(TaskStatus.TODO),

  priority: z.nativeEnum(TaskPriority, {
    errorMap: () => ({
      message: `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`
    })
  }).default(TaskPriority.MEDIUM),

  dueDate: dateSchema
    .refine(date => date > new Date(), {
      message: 'Due date must be in the future',
    })
    .optional(),

  assigneeId: z.string()
    .uuid('Assignee ID must be a valid UUID')
    .optional()
    .nullable(),

  projectId: z.string()
    .uuid('Project ID must be a valid UUID')
    .min(1, 'Project ID is required'),

  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be at most 50 characters')
      .regex(/^[a-zA-Z0-9\-_]+$/, 'Tag can only contain letters, numbers, hyphens and underscores')
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  estimatedHours: z.number()
    .min(0.5, 'Estimated hours must be at least 0.5')
    .max(1000, 'Estimated hours must be at most 1000')
    .optional()
    .default(1),

  actualHours: z.number()
    .min(0, 'Actual hours cannot be negative')
    .max(1000, 'Actual hours must be at most 1000')
    .optional()
    .default(0),
});

// Schema para atualização de tarefa
export const taskUpdateSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()\[\]]+$/, 'Title contains invalid characters')
    .optional(),

  description: z.string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),

  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    })
  }).optional(),

  priority: z.nativeEnum(TaskPriority, {
    errorMap: () => ({
      message: `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`
    })
  }).optional(),

  dueDate: z.union([dateSchema, z.null()])
    .refine((date) => date === null || date > new Date(), {
      message: 'Due date must be in the future or null',
    })
    .optional(),

  assigneeId: z.union([z.string().uuid('Assignee ID must be a valid UUID'), z.null()])
    .optional(),

  projectId: z.string()
    .uuid('Project ID must be a valid UUID')
    .optional(),

  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be at most 50 characters')
      .regex(/^[a-zA-Z0-9\-_]+$/, 'Tag can only contain letters, numbers, hyphens and underscores')
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional(),

  estimatedHours: z.number()
    .min(0.5, 'Estimated hours must be at least 0.5')
    .max(1000, 'Estimated hours must be at most 1000')
    .optional(),

  actualHours: z.number()
    .min(0, 'Actual hours cannot be negative')
    .max(1000, 'Actual hours must be at most 1000')
    .optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Schema para atualização de status
export const taskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    })
  }),

  comment: z.string()
    .max(500, 'Comment must be at most 500 characters')
    .optional(),
});

// Schema para atribuição de tarefa
export const taskAssignSchema = z.object({
  assigneeId: z.string()
    .uuid('Assignee ID must be a valid UUID'),

  notify: z.boolean()
    .optional()
    .default(true),
});

// Schema para filtro de tarefas (com paginação e ordenação)
export const taskFilterSchema = z.object({
  // Filtros básicos
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().uuid('Project ID must be a valid UUID').optional(),
  assigneeId: z.string().uuid('Assignee ID must be a valid UUID').optional(),
  createdBy: z.string().uuid('Creator ID must be a valid UUID').optional(),

  // Filtros de data
  dueDateFrom: dateSchema.optional(),
  dueDateTo: dateSchema.optional(),
  createdAtFrom: dateSchema.optional(),
  createdAtTo: dateSchema.optional(),
  updatedAtFrom: dateSchema.optional(),
  updatedAtTo: dateSchema.optional(),

  // Filtros de conteúdo
  tags: z.array(z.string()).optional(),
  search: z.string()
    .max(100, 'Search term must be at most 100 characters')
    .optional()
    .transform(val => val?.trim()),

  // Filtros numéricos
  estimatedHoursMin: z.number()
    .min(0, 'Estimated hours minimum cannot be negative')
    .optional(),
  estimatedHoursMax: z.number()
    .min(0, 'Estimated hours maximum cannot be negative')
    .optional(),
  actualHoursMin: z.number()
    .min(0, 'Actual hours minimum cannot be negative')
    .optional(),
  actualHoursMax: z.number()
    .min(0, 'Actual hours maximum cannot be negative')
    .optional(),

  // Paginação
  page: z.number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .optional()
    .default(1)
    .transform(val => Math.max(1, val)),

  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20)
    .transform(val => Math.max(1, Math.min(100, val))),

  // Ordenação
  sortBy: z.enum([
    'createdAt',
    'updatedAt',
    'dueDate',
    'title',
    'priority',
    'status',
    'estimatedHours',
    'actualHours'
  ])
    .optional()
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),

  // Filtros especiais
  overdue: z.boolean()
    .optional()
    .default(false)
    .describe('Filter for overdue tasks'),

  dueSoon: z.boolean()
    .optional()
    .default(false)
    .describe('Filter for tasks due soon (within 3 days)'),

  unassigned: z.boolean()
    .optional()
    .default(false)
    .describe('Filter for unassigned tasks'),

  // Filtro de intervalo de IDs
  ids: z.array(z.string().uuid('ID must be a valid UUID'))
    .optional()
    .transform(ids => ids?.filter((id, index, self) => self.indexOf(id) === index)), // Remove duplicates

}).superRefine((data, ctx) => {
  // Validação cruzada de datas
  if (data.dueDateFrom && data.dueDateTo) {
    if (data.dueDateFrom > data.dueDateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dueDateFrom must be before dueDateTo',
        path: ['dueDateFrom'],
      });
    }
  }

  if (data.createdAtFrom && data.createdAtTo) {
    if (data.createdAtFrom > data.createdAtTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'createdAtFrom must be before createdAtTo',
        path: ['createdAtFrom'],
      });
    }
  }

  if (data.updatedAtFrom && data.updatedAtTo) {
    if (data.updatedAtFrom > data.updatedAtTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'updatedAtFrom must be before updatedAtTo',
        path: ['updatedAtFrom'],
      });
    }
  }

  // Validação de intervalos numéricos
  if (data.estimatedHoursMin && data.estimatedHoursMax) {
    if (data.estimatedHoursMin > data.estimatedHoursMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'estimatedHoursMin must be less than estimatedHoursMax',
        path: ['estimatedHoursMin'],
      });
    }
  }

  if (data.actualHoursMin && data.actualHoursMax) {
    if (data.actualHoursMin > data.actualHoursMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'actualHoursMin must be less than actualHoursMax',
        path: ['actualHoursMin'],
      });
    }
  }

  // Validação de página e limite
  if (data.page < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Page must be at least 1',
      path: ['page'],
    });
  }

  if (data.limit < 1 || data.limit > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Limit must be between 1 and 100',
      path: ['limit'],
    });
  }
});

// Schema para filtro de tarefas sem paginação (apenas filtros)
export const taskFilterOnlySchema = taskFilterSchema
  .omit({ page: true, limit: true, sortBy: true, sortOrder: true })
  .extend({
    // Pode adicionar campos específicos para filtro apenas
    includeCompleted: z.boolean()
      .optional()
      .default(true)
      .describe('Include completed tasks in results'),
  });

// Schema para relatório de tarefas
export const taskReportSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID').optional(),
  assigneeId: z.string().uuid('Assignee ID must be a valid UUID').optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'status', 'priority', 'assignee']).optional().default('day'),
  includeDetails: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startDate must be before endDate',
      path: ['startDate'],
    });
  }
});

// Schema para exportação de tarefas
export const taskExportSchema = z.object({
  format: z.enum(['csv', 'json', 'excel']).optional().default('json'),
  includeFields: z.array(z.enum([
    'id',
    'title',
    'description',
    'status',
    'priority',
    'dueDate',
    'assignee',
    'project',
    'createdBy',
    'tags',
    'estimatedHours',
    'actualHours',
    'createdAt',
    'updatedAt'
  ])).optional().default(['id', 'title', 'status', 'priority', 'dueDate', 'assignee']),
  filters: taskFilterOnlySchema.optional(),
});

// Helper function para construir query MongoDB a partir dos filtros
export const buildTaskQueryFromFilters = (filters: z.infer<typeof taskFilterSchema>) => {
  const query: any = {};

  // Filtros básicos
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.projectId) query.projectId = filters.projectId;
  if (filters.assigneeId) query.assigneeId = filters.assigneeId;
  if (filters.createdBy) query.createdBy = filters.createdBy;

  // Filtros de data
  if (filters.dueDateFrom || filters.dueDateTo) {
    query.dueDate = {};
    if (filters.dueDateFrom) query.dueDate.$gte = filters.dueDateFrom;
    if (filters.dueDateTo) query.dueDate.$lte = filters.dueDateTo;
  }

  if (filters.createdAtFrom || filters.createdAtTo) {
    query.createdAt = {};
    if (filters.createdAtFrom) query.createdAt.$gte = filters.createdAtFrom;
    if (filters.createdAtTo) query.createdAt.$lte = filters.createdAtTo;
  }

  if (filters.updatedAtFrom || filters.updatedAtTo) {
    query.updatedAt = {};
    if (filters.updatedAtFrom) query.updatedAt.$gte = filters.updatedAtFrom;
    if (filters.updatedAtTo) query.updatedAt.$lte = filters.updatedAtTo;
  }

  // Filtros de tags
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  // Filtros numéricos
  if (filters.estimatedHoursMin || filters.estimatedHoursMax) {
    query.estimatedHours = {};
    if (filters.estimatedHoursMin) query.estimatedHours.$gte = filters.estimatedHoursMin;
    if (filters.estimatedHoursMax) query.estimatedHours.$lte = filters.estimatedHoursMax;
  }

  if (filters.actualHoursMin || filters.actualHoursMax) {
    query.actualHours = {};
    if (filters.actualHoursMin) query.actualHours.$gte = filters.actualHoursMin;
    if (filters.actualHoursMax) query.actualHours.$lte = filters.actualHoursMax;
  }

  // Filtros especiais
  if (filters.overdue) {
    query.dueDate = { ...query.dueDate, $lt: new Date() };
    query.status = { $ne: TaskStatus.DONE };
  }

  if (filters.dueSoon) {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    query.dueDate = {
      ...query.dueDate,
      $gte: new Date(),
      $lte: threeDaysFromNow
    };
    query.status = { $ne: TaskStatus.DONE };
  }

  if (filters.unassigned) {
    query.assigneeId = { $exists: false };
  }

  // Filtro de IDs
  if (filters.ids && filters.ids.length > 0) {
    query.id = { $in: filters.ids };
  }

  // Filtro de busca textual
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { tags: filters.search }
    ];
  }

  return query;
};

// Helper function para construir opções de ordenação
export const buildSortOptions = (filters: z.infer<typeof taskFilterSchema>) => {
  const sortOptions: any = {};
  sortOptions[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
  return sortOptions;
};

// Helper function para calcular paginação
export const buildPagination = (filters: z.infer<typeof taskFilterSchema>) => {
  const skip = (filters.page - 1) * filters.limit;
  return { skip, limit: filters.limit };
};

// Tipo inferido do schema de criação
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

// Tipo inferido do schema de atualização
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// Tipo inferido do schema de filtro
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;

// Tipo inferido do schema de filtro apenas
export type TaskFilterOnlyInput = z.infer<typeof taskFilterOnlySchema>;

// Tipo inferido do schema de relatório
export type TaskReportInput = z.infer<typeof taskReportSchema>;

// Tipo inferido do schema de exportação
export type TaskExportInput = z.infer<typeof taskExportSchema>;


// Tipo inferido do schema de criação
export type UserCreateInput = z.infer<typeof userCreateSchema>;

// Tipo inferido do schema de atualização
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// Tipo inferido do schema de login
export type UserLoginInput = z.infer<typeof userLoginSchema>;