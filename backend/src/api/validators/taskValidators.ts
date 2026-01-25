import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../../core/domain/Task';

// Validador de data
const dateSchema = z.string()
  .refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  .transform(val => new Date(val));

// Schema para criação de tarefa
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

// Schema para filtro de tarefas
export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  dueDateFrom: dateSchema.optional(),
  dueDateTo: dateSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const buildTaskQueryFromFilters = z.object({
  assigneeId: z.string()
    .uuid('Assignee ID must be a valid UUID'),

  notify: z.boolean()
    .optional()
    .default(true),
});

export const buildSortOptions = z.object({})
export const buildPagination = z.object({})

// Tipo inferido do schema de criação
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

// Tipo inferido do schema de atualização
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// Tipo inferido do schema de filtro
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;