import { User } from '../../../domain/User';
import { IUserRepository } from '../../repositories/IUserRepository';

export class ListUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    return users;
  }
}