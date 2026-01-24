import { Request, Response } from "express";
import { CreateUserUseCase } from "../../core/application/useCases/user/CreateUserUseCase";
import { MongoUserRepository } from "../../core/infrastructure/repositories/MongoUserRepository";
import { AuthenticatedRequest } from "../middleware/auth";

export class UserController {
  private createUserUseCase: CreateUserUseCase;

  constructor() {
    const userRepository = new MongoUserRepository();
    this.createUserUseCase = new CreateUserUseCase(userRepository);
  }

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

  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // implementar logica para buscar usuario atual
      res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message 
      })
    }
  }

}
