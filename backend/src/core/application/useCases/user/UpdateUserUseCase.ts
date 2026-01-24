import { User } from '../../../domain/User';
import { IUserRepository } from '../../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../../../../api/middleware/errorHandler';
import { UserRole } from '../../../domain/User';

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, userData: Partial<any>): Promise<User> {
    // Validar dados
    this.validateUserData(userData);

    const user = await this.userRepository.update(id, userData);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return user;
  }

  private validateUserData(userData: any): void {
    if (userData.email && !userData.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (userData.password && userData.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    if (userData.role && !Object.values(UserRole).includes(userData.role)) {
      throw new ValidationError('Invalid user role');
    }
  }
}