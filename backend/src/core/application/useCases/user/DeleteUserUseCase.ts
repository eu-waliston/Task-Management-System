import { IUserRepository } from '../../repositories/IUserRepository';

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result;
  }
}