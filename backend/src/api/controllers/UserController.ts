import { Request, Response } from "express";
import { CreateUserUseCase } from "../../core/application/useCases/user/CreateUserUseCase";
import { GetUserUseCase } from "../../core/application/useCases/user/GetUserUseCase";
import { UpdateUserUseCase } from "../../core/application/useCases/user/UpdateUserUseCase";
import { DeleteUserUseCase } from "../../core/application/useCases/user/DeleteUserUseCase";
import { ListUsersUseCase } from "../../core/application/useCases/user/ListUsersUseCase";
import { MongoUserRepository } from "../../core/infrastructure/repositories/MongoUserRepository";
import { AuthernticatedRequest } from "../middleware/auth";
import { NotFoundError, UnauthorizedError } from "../middleware/errorHandler";
export class UserController {
  private createUserUseCase: CreateUserUseCase;
  private getUserUseCase: GetUserUseCase;
  private updateUserUseCase: UpdateUserUseCase;
  private deleteUserUseCase: DeleteUserUseCase;
  private listUsersUseCase: ListUsersUseCase;

  constructor() {
    const userRepository = new MongoUserRepository();
    this.createUserUseCase = new CreateUserUseCase(userRepository);
    this.getUserUseCase = new GetUserUseCase(userRepository);
    this.updateUserUseCase = new UpdateUserUseCase(userRepository);
    this.deleteUserUseCase = new DeleteUserUseCase(userRepository);
    this.listUsersUseCase = new ListUsersUseCase(userRepository);
  }

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [admin, manager, developer, viewer]
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: User with this email already exists
   */
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getCurrentUser = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const user = await this.getUserUseCase.execute(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getUserById = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Verificar se o usuário tem permissão
      if (!req.user || (req.user.role !== "admin" && req.user.id !== id)) {
        throw new UnauthorizedError(
          "You do not have permission to view this user",
        );
      }

      const user = await this.getUserUseCase.execute(id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getAllUsers = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const users = await this.listUsersUseCase.execute();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateUser = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Verificar se o usuário tem permissão
      if (!req.user || (req.user.role !== "admin" && req.user.id !== id)) {
        throw new UnauthorizedError(
          "You do not have permission to update this user",
        );
      }

      const user = await this.updateUserUseCase.execute(id, req.body);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  deleteUser = async (
    req: AuthernticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.deleteUserUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  };
}
