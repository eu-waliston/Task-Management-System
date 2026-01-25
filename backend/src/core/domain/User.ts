import { UserInfoOptions } from 'os';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export interface UserProps {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  dueDate?: Date;
  assigneeId: string;
  projectId: UserRole;
  createdBy: UserRole;
  tags: UserInfoOptions;
  estimatedHours: string,
  actualHours: string,
  status: string;

}

export enum UserStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  DONE = "done",
}

export enum UserPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}



export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly role: UserRole;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly dueDate: Date;

  title: any;
  description: any;
  status: any;
  priority: any;
  assigneeId: any;
  projectId: any;
  createdBy: any;
  tags: any;
  estimatedHours: any;
  actualHours: any;


  constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.password = props.password;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.role = props.role;
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.dueDate = props.updatedAt || new Date();

  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public update(props: Partial<UserProps>): User {
    return new User({
      ...this,
      ...props,
      updatedAt: new Date()
    });
  }

}


