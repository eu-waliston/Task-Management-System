import { User, UserProps, UserStatus, UserPriority } from '../../domain/User';
import { Database } from '../../../config/database';
import { logger } from '../../../config/logger';
import { NotFoundError } from '../../../api/middleware/errorHandler';

export class MongoUserRepository {
  private collection;

  constructor() {
    this.collection = Database.getCollection('users');
  }

  async findById(id: string): Promise<User | null> {
    try {
      const UserDoc = await this.collection.findOne({ id });

      if (UserDoc) {
        logger.debug('User found by ID', { UserId: id });
        return this.mapToEntity(UserDoc);
      }

      logger.debug('User not found by ID', { UserId: id });
      return null;
    } catch (error) {
      logger.error('Error finding User by ID', error as Error, { UserId: id });
      throw error;
    }
  }

  async findAll(filters?: Partial<UserProps>): Promise<User[]> {
    try {
      const query = filters || {};
      const UserDocs = await this.collection.find(query).toArray();

      logger.debug('Found Users', { count: UserDocs.length, filters });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding all Users', error as Error, { filters });
      throw error;
    }
  }

  async findByProject(projectId: string): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({ projectId }).toArray();

      logger.debug('Found Users by project', { projectId, count: UserDocs.length });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users by project', error as Error, { projectId });
      throw error;
    }
  }

  async findByAssignee(assigneeId: string): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({ assigneeId }).toArray();

      logger.debug('Found Users by assignee', { assigneeId, count: UserDocs.length });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users by assignee', error as Error, { assigneeId });
      throw error;
    }
  }

  async findByid(id: string): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({ id }).toArray();

      logger.debug('Found Users by id (findByid)', { id, count: UserDocs.length });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users by id (findByid)', error as Error, { id });
      throw error;
    }
  }

  async findByCreator(createdBy: string): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({ createdBy }).toArray();

      logger.debug('Found Users by creator', { createdBy, count: UserDocs.length });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users by creator', error as Error, { createdBy });
      throw error;
    }
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({ status }).toArray();

      logger.debug('Found Users by status', { status, count: UserDocs.length });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users by status', error as Error, { status });
      throw error;
    }
  }

  async findByPriority(priority: UserPriority): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({ priority }).toArray();

      logger.debug('Found Users by priority', { priority, count: UserDocs.length });
      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users by priority', error as Error, { priority });
      throw error;
    }
  }

  async findWithFilters(filters: {
    projectId?: string;
    assigneeId?: string;
    createdBy?: string;
    status?: UserStatus;
    priority?: UserPriority;
    tags?: string[];
    dueDateFrom?: Date;
    dueDateTo?: Date;
  }): Promise<User[]> {
    try {
      const query: any = {};

      if (filters.projectId) query.projectId = filters.projectId;
      if (filters.assigneeId) query.assigneeId = filters.assigneeId;
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.dueDateFrom || filters.dueDateTo) {
        query.dueDate = {};
        if (filters.dueDateFrom) query.dueDate.$gte = filters.dueDateFrom;
        if (filters.dueDateTo) query.dueDate.$lte = filters.dueDateTo;
      }

      const UserDocs = await this.collection.find(query).toArray();

      logger.debug('Found Users with filters', {
        filters,
        count: UserDocs.length
      });

      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error finding Users with filters', error as Error, { filters });
      throw error;
    }
  }

  async create(UserProps: UserProps): Promise<User> {
    try {
      const user = new User(UserProps);
      await this.collection.insertOne(this.mapToDocument(user));

      logger.info('User created successfully', {
        UserId: user.id,
        createdBy: user.createdBy,
      });

      return user;
    } catch (error) {
      logger.error('Error creating User', error as Error, { UserProps });
      throw error;
    }
  }

  async update(id: string, UserProps: Partial<UserProps>): Promise<User | null> {
    try {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new NotFoundError(`User with id ${id} not found`);
      }

      const updateData = {
        ...UserProps,
        updatedAt: new Date(),
      };

      const result = await this.collection.findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        logger.info('User updated successfully', {
          UserId: id,
          updatedFields: Object.keys(UserProps),
        });
        return this.mapToEntity(result);
      }

      return null;
    } catch (error) {
      logger.error('Error updating User', error as Error, { UserId: id, UserProps });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ id });
      const deleted = result.deletedCount > 0;

      if (deleted) {
        logger.info('User deleted successfully', { UserId: id });
      } else {
        logger.warn('User not found for deletion', { UserId: id });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting User', error as Error, { UserId: id });
      throw error;
    }
  }

  async countByStatus(projectId?: string): Promise<Record<UserStatus, number>> {
    try {
      const pipeline: any[] = [];

      if (projectId) {
        pipeline.push({ $match: { projectId } });
      }

      pipeline.push(
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        } }
      );

      const results = await this.collection.aggregate(pipeline).toArray();

      const counts: Record<UserStatus, number> = {
        [UserStatus.TODO]: 0,
        [UserStatus.IN_PROGRESS]: 0,
        [UserStatus.REVIEW]: 0,
        [UserStatus.DONE]: 0,
      };

      results.forEach(result => {
        if (Object.values(UserStatus).includes(result._id)) {
          counts[result._id as UserStatus] = result.count;
        }
      });

      logger.debug('User counts by status', { projectId, counts });
      return counts;
    } catch (error) {
      logger.error('Error counting Users by status', error as Error, { projectId });
      throw error;
    }
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const UserDocs = await this.collection.find({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: searchTerm }
        ]
      }).toArray();

      logger.debug('Users found by search', {
        searchTerm,
        count: UserDocs.length
      });

      return UserDocs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Error searching Users', error as Error, { searchTerm });
      throw error;
    }
  }

    async findByEmail(email: string): Promise<User | null> {
    try {
      const userDoc = await this.collection.findOne({ email });

      if (userDoc) {
        logger.debug('User found by email', { email });
        return this.mapToEntity(userDoc);
      }

      logger.debug('User not found by email', { email });
      return null;
    } catch (error) {
      logger.error('Error finding user by email', error as Error, { email });
      throw error;
    }
  }


  private mapToEntity(doc: any): User {
    return new User({
      id: doc.id,
      email: doc.email,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      status: doc.status,
      dueDate: doc.dueDate ? new Date(doc.dueDate) : undefined,
      assigneeId: doc.assigneeId,
      projectId: doc.projectId,
      createdBy: doc.createdBy,
      tags: doc.tags || [],
      estimatedHours: doc.estimatedHours,
      actualHours: doc.actualHours,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      role: doc.role,
      isActive: doc.isActive,
    });
  }

  private mapToDocument(User: User): any {
    return {
      id: User.id,
      title: User.title,
      description: User.description,
      status: User.status,
      priority: User.priority,
      dueDate: User.dueDate,
      assigneeId: User.assigneeId,
      projectId: User.projectId,
      createdBy: User.createdBy,
      tags: User.tags,
      estimatedHours: User.estimatedHours,
      actualHours: User.actualHours,
      createdAt: User.createdAt,
      updatedAt: User.updatedAt,
    };
  }


}