import { User } from '../../../domain/User';
import { IUserRepository } from '../../repositories/IUserRepository';
import { NotFoundError } from '../../../../api/middleware/errorHandler';

export class GetUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return user;
  }
}