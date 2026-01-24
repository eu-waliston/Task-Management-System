import { User, UserProps, UserRole } from '../../../domain/User';
import { IUserRepository } from '../../repositories/IUserRepository';
import { ConflictError, ValidationError } from '../../errors/AppError';
//TODO Cannot find module '../../errors/AppError' or its corresponding type declarations.
export class CreateUserUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(userData: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>{

        //validar dadso de entrada
        this.validateUserData(userData);

        // verificar se o email ja existe
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if(existingUser) {
            throw new ConflictError('User with this email already exists')
        }

        // criar usuário
        const user = await this.userRepository.create(userData);

        return user;
    }

    private validateUserData(userData: any):void {
        const { email, password, firstName, lastName, role} = userData;

        if(!email || !password || !firstName || !lastName || !role) {
            throw new ValidationError('Mising required fields');
        }

        if(!email.includes('@')) {
            throw new ValidationError('Invalid email format');
        }

        if (password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters long');
        }

        if (!Object.values(UserRole).includes(role)) {
            throw new ValidationError('Invalid user role');
        }
    }
}