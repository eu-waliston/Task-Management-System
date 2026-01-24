import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../../core/domain/User';
import {
  validate,
  validateQuery,
  validateParams,
  sanitizeInput
} from '../middleware/validation';
import {
  userCreateSchema,
  userUpdateSchema,
  userLoginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  taskFilterSchema
} from '../validators/userValidators';

const router = Router();
const userController = new UserController();

// Aplicar sanitização em todas as rotas
router.use(sanitizeInput);

/**
 * @route POST /api/users
 * @desc Criar um novo usuário
 * @access Public (em produção, pode ser restrito)
 */
router.post('/', validate(userCreateSchema), userController.createUser);

/**
 * @route POST /api/users/login
 * @desc Fazer login de usuário
 * @access Public
 */
router.post('/login', validate(userLoginSchema), userController.login);

/**
 * @route GET /api/users/me
 * @desc Obter informações do usuário atual
 * @access Private (qualquer usuário autenticado)
 */
router.get('/me', authenticateToken, userController.getCurrentUser);

/**
 * @route GET /api/users
 * @desc Listar todos os usuários
 * @access Private (apenas admin)
 */
router.get(
  '/',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  validateQuery(taskFilterSchema),
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Obter usuário por ID
 * @access Private (admin ou o próprio usuário)
 */
router.get(
  '/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Atualizar usuário
 * @access Private (admin ou o próprio usuário)
 */
router.put(
  '/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validate(userUpdateSchema),
  userController.updateUser
);

/**
 * @route PATCH /api/users/:id/password
 * @desc Alterar senha do usuário
 * @access Private (admin ou o próprio usuário)
 */
router.patch(
  '/:id/password',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validate(changePasswordSchema),
  userController.changePassword
);

/**
 * @route POST /api/users/forgot-password
 * @desc Solicitar reset de senha
 * @access Public
 */
router.post(
  '/forgot-password',
  validate(z.object({ email: z.string().email() })),
  userController.forgotPassword
);

/**
 * @route POST /api/users/reset-password
 * @desc Resetar senha com token
 * @access Public
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  userController.resetPassword
);

/**
 * @route DELETE /api/users/:id
 * @desc Deletar usuário
 * @access Private (apenas admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  validateParams(z.object({ id: z.string().uuid() })),
  userController.deleteUser
);

export { router as userRoutes };

// Importar zod para validação inline
import { z } from 'zod';