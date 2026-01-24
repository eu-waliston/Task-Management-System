import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../../core/domain/User';
import {
  validate,
  validateQuery,
  validateParams,
  sanitizeInput
} from '../middleware/validation';
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskStatusSchema,
  taskAssignSchema,
  taskFilterSchema
} from '../validators/taskValidators';
import { z } from 'zod';

const router = Router();
const taskController = new TaskController();

// Aplicar sanitização em todas as rotas
router.use(sanitizeInput);

/**
 * @route GET /api/tasks
 * @desc Listar todas as tarefas com filtros
 * @access Private (usuários autenticados)
 */
router.get(
  '/',
  authenticateToken,
  validateQuery(taskFilterSchema),
  taskController.getAllTasks
);

/**
 * @route GET /api/tasks/project/:projectId
 * @desc Listar tarefas por projeto
 * @access Private (usuários autenticados)
 */
router.get(
  '/project/:projectId',
  authenticateToken,
  validateParams(z.object({ projectId: z.string().uuid() })),
  validateQuery(taskFilterSchema),
  taskController.getTasksByProject
);

/**
 * @route GET /api/tasks/assigned
 * @desc Listar tarefas atribuídas ao usuário atual
 * @access Private (usuários autenticados)
 */
router.get(
  '/assigned',
  authenticateToken,
  validateQuery(taskFilterSchema),
  taskController.getAssignedTasks
);

/**
 * @route GET /api/tasks/created
 * @desc Listar tarefas criadas pelo usuário atual
 * @access Private (usuários autenticados)
 */
router.get(
  '/created',
  authenticateToken,
  validateQuery(taskFilterSchema),
  taskController.getCreatedTasks
);

/**
 * @route GET /api/tasks/:id
 * @desc Obter tarefa por ID
 * @access Private (usuários autenticados)
 */
router.get(
  '/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  taskController.getTaskById
);

/**
 * @route POST /api/tasks
 * @desc Criar nova tarefa
 * @access Private (usuários autenticados com permissão)
 */
router.post(
  '/',
  authenticateToken,
  authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER]),
  validate(taskCreateSchema),
  taskController.createTask
);

/**
 * @route PUT /api/tasks/:id
 * @desc Atualizar tarefa
 * @access Private (admin, manager ou criador da tarefa)
 */
router.put(
  '/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validate(taskUpdateSchema),
  taskController.updateTask
);

/**
 * @route PATCH /api/tasks/:id/status
 * @desc Atualizar status da tarefa
 * @access Private (assignee, admin ou manager)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validate(taskStatusSchema),
  taskController.updateTaskStatus
);

/**
 * @route PATCH /api/tasks/:id/assign
 * @desc Atribuir tarefa a um usuário
 * @access Private (admin ou manager)
 */
router.patch(
  '/:id/assign',
  authenticateToken,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  validateParams(z.object({ id: z.string().uuid() })),
  validate(taskAssignSchema),
  taskController.assignTask
);

/**
 * @route DELETE /api/tasks/:id
 * @desc Deletar tarefa
 * @access Private (apenas admin ou manager)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  validateParams(z.object({ id: z.string().uuid() })),
  taskController.deleteTask
);

export { router as taskRoutes };