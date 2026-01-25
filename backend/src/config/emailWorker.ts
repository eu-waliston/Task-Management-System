import { rabbitMQService } from '../config/rabbitmq';
import { logger } from '../config/logger';
import { sendEmail } from '../service/emailService';

export class EmailWorker {
  async start(): Promise<void> {
    try {
      await rabbitMQService.consumeMessages('email_queue', async (message) => {
        logger.info('Processing email message:', message);
        
        switch (message.type) {
          case 'welcome_email':
            await this.sendWelcomeEmail(message.payload);
            break;
          case 'task_assignment':
            await this.sendTaskAssignmentEmail(message.payload);
            break;
          case 'password_reset':
            await this.sendPasswordResetEmail(message.payload);
            break;
          default:
            logger.warn('Unknown email type:', message.type);
        }
      });

      logger.info('Email worker started successfully');
    } catch (error) {
      logger.error('Failed to start email worker:', error);
      throw error;
    }
  }

  private async sendWelcomeEmail(payload: any): Promise<void> {
    const { email, firstName } = payload;
    const subject = 'Welcome to Task Management System';
    const html = `
      <h1>Welcome, ${firstName}!</h1>
      <p>Your account has been successfully created.</p>
    `;
    
    await sendEmail(email, subject, html);
  }

  private async sendTaskAssignmentEmail(payload: any): Promise<void> {
    // Implementar lógica de email de atribuição de tarefa
  }

  private async sendPasswordResetEmail(payload: any): Promise<void> {
    // Implementar lógica de email de reset de senha
  }
}
