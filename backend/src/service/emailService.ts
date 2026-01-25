import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

// Tipos de email
export type EmailType = 
  | 'welcome'
  | 'password_reset'
  | 'task_assigned'
  | 'task_updated'
  | 'task_due_soon'
  | 'task_overdue'
  | 'project_invitation'
  | 'system_notification';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  html?: string;
  text?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
  templatesDir: string;
  enabled: boolean;
  retryAttempts: number;
  retryDelay: number;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Task Management System',
        email: process.env.EMAIL_FROM_EMAIL || 'noreply@taskmanagement.com',
      },
      templatesDir: process.env.EMAIL_TEMPLATES_DIR || 'templates/emails',
      enabled: process.env.EMAIL_ENABLED !== 'false',
      retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000'),
    };

    this.initialize();
  }

  private initialize(): void {
    if (!this.config.enabled) {
      logger.warn('Email service is disabled');
      return;
    }

    if (!this.config.auth.user || !this.config.auth.pass) {
      logger.error('Email credentials not configured');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10,
      });

      // Verificar conexão
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Failed to connect to email server:', error);
          this.isInitialized = false;
        } else {
          logger.info('Email service initialized successfully');
          this.isInitialized = true;
        }
      });

      // Monitorar eventos do transporter
      this.transporter.on('idle', () => {
        logger.debug('Email transporter is idle');
      });

      this.transporter.on('error', (error) => {
        logger.error('Email transporter error:', error);
      });

    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isInitialized = false;
    }
  }

  private async loadTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        this.config.templatesDir,
        `${templateName}.hbs`
      );

      if (!fs.existsSync(templatePath)) {
        logger.warn(`Email template not found: ${templatePath}`);
        
        // Template padrão
        return this.getDefaultTemplate(templateName, data);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(data);
      
    } catch (error) {
      logger.error(`Error loading email template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName, data);
    }
  }

  private getDefaultTemplate(templateName: string, data: Record<string, any>): string {
    const defaultTemplates: Record<string, string> = {
      welcome: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Task Management System!</h1>
            </div>
            <div class="content">
              <p>Hello {{name}},</p>
              <p>Your account has been successfully created.</p>
              <p>You can now login and start managing your tasks.</p>
              <p><a href="{{loginUrl}}" class="button">Login to your account</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      password_reset: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .token { font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello {{name}},</p>
              <p>You requested to reset your password. Click the button below to proceed:</p>
              <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
              <p>Or use this token: <span class="token">{{token}}</span></p>
              <p>This link will expire in {{expiryHours}} hours.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      task_assigned: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .task-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Task Assigned</h1>
            </div>
            <div class="content">
              <p>Hello {{assigneeName}},</p>
              <p>You have been assigned a new task:</p>
              <div class="task-info">
                <h3>{{taskTitle}}</h3>
                <p><strong>Project:</strong> {{projectName}}</p>
                <p><strong>Priority:</strong> {{priority}}</p>
                <p><strong>Due Date:</strong> {{dueDate}}</p>
                <p><strong>Description:</strong> {{taskDescription}}</p>
              </div>
              <p><a href="{{taskUrl}}" class="button">View Task</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const template = defaultTemplates[templateName] || `
      <!DOCTYPE html>
      <html>
      <head><style>body { font-family: Arial, sans-serif; }</style></head>
      <body>
        <p>{{message}}</p>
      </body>
      </html>
    `;

    return handlebars.compile(template)(data);
  }

  private formatRecipients(recipients: EmailRecipient | EmailRecipient[]): string {
    if (Array.isArray(recipients)) {
      return recipients.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ');
    }
    return recipients.name ? `"${recipients.name}" <${recipients.email}>` : recipients.email;
  }

  private async sendWithRetry(mailOptions: nodemailer.SendMailOptions, attempt: number = 1): Promise<void> {
    if (!this.transporter || !this.isInitialized) {
      throw new Error('Email service is not initialized');
    }

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        attempt,
      });
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        logger.warn(`Email send failed, retrying (attempt ${attempt + 1}/${this.config.retryAttempts})`, {
          to: mailOptions.to,
          subject: mailOptions.subject,
          error: (error as Error).message,
        });

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.sendWithRetry(mailOptions, attempt + 1);
      }

      logger.error('Email send failed after all retry attempts', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.config.enabled) {
      logger.warn('Email service is disabled, email not sent', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      let htmlContent = options.html;
      let textContent = options.text;

      // Carregar template se fornecido
      if (options.template) {
        const templateData = options.templateData || {};
        htmlContent = await this.loadTemplate(options.template, templateData);
        
        // Gerar versão de texto se não fornecida
        if (!textContent) {
          textContent = this.generateTextFromHtml(htmlContent);
        }
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${this.config.from.name}" <${this.config.from.email}>`,
        to: this.formatRecipients(options.to),
        subject: options.subject,
        html: htmlContent,
        text: textContent,
        cc: options.cc ? this.formatRecipients(options.cc) : undefined,
        bcc: options.bcc ? this.formatRecipients(options.bcc) : undefined,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
        priority: options.priority,
      };

      await this.sendWithRetry(mailOptions);
      return true;
      
    } catch (error) {
      logger.error('Failed to send email:', error as Error, {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }
  }

  private generateTextFromHtml(html: string): string {
    // Conversão simples de HTML para texto
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  // Métodos específicos para tipos de email comuns
  async sendWelcomeEmail(userEmail: string, userName: string, loginUrl: string): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Welcome to Task Management System',
      template: 'welcome',
      templateData: {
        name: userName,
        loginUrl,
      },
    });
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string, resetUrl: string): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Password Reset Request',
      template: 'password_reset',
      templateData: {
        name: userName,
        token: resetToken,
        resetUrl,
        expiryHours: 24,
      },
      priority: 'high',
    });
  }

  async sendTaskAssignmentEmail(
    assigneeEmail: string,
    assigneeName: string,
    taskTitle: string,
    taskDescription: string,
    projectName: string,
    priority: string,
    dueDate: string,
    taskUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: { email: assigneeEmail, name: assigneeName },
      subject: `New Task Assigned: ${taskTitle}`,
      template: 'task_assigned',
      templateData: {
        assigneeName,
        taskTitle,
        taskDescription,
        projectName,
        priority,
        dueDate,
        taskUrl,
      },
    });
  }

  async sendTaskUpdatedEmail(
    userEmail: string,
    userName: string,
    taskTitle: string,
    changes: string[],
    taskUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Task Updated: ${taskTitle}`,
      template: 'task_updated',
      templateData: {
        name: userName,
        taskTitle,
        changes,
        taskUrl,
      },
    });
  }

  async sendTaskDueSoonEmail(
    userEmail: string,
    userName: string,
    taskTitle: string,
    dueDate: string,
    daysLeft: number,
    taskUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Task Due Soon: ${taskTitle}`,
      template: 'task_due_soon',
      templateData: {
        name: userName,
        taskTitle,
        dueDate,
        daysLeft,
        taskUrl,
      },
      priority: 'high',
    });
  }

  async sendTaskOverdueEmail(
    userEmail: string,
    userName: string,
    taskTitle: string,
    dueDate: string,
    taskUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `URGENT: Task Overdue - ${taskTitle}`,
      template: 'task_overdue',
      templateData: {
        name: userName,
        taskTitle,
        dueDate,
        taskUrl,
      },
      priority: 'high',
    });
  }

  async sendProjectInvitationEmail(
    userEmail: string,
    userName: string,
    projectName: string,
    inviterName: string,
    invitationUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Invitation to Project: ${projectName}`,
      template: 'project_invitation',
      templateData: {
        name: userName,
        projectName,
        inviterName,
        invitationUrl,
      },
    });
  }

  async sendSystemNotification(
    userEmail: string,
    userName: string,
    notificationTitle: string,
    notificationMessage: string,
    actionUrl?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: notificationTitle,
      template: 'system_notification',
      templateData: {
        name: userName,
        title: notificationTitle,
        message: notificationMessage,
        actionUrl,
      },
    });
  }

  // Método para enviar email para múltiplos destinatários
  async sendBulkEmail(
    recipients: EmailRecipient[],
    subject: string,
    template: string,
    templateData: Record<string, any>,
    options?: {
      cc?: EmailRecipient[];
      bcc?: EmailRecipient[];
      attachments?: EmailAttachment[];
    }
  ): Promise<{ success: number; failed: number }> {
    const results = {
      success: 0,
      failed: 0,
    };

    // Enviar emails em batches para não sobrecarregar o servidor SMTP
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const emailData = { ...templateData, name: recipient.name };
          
          await this.sendEmail({
            to: recipient,
            subject,
            template,
            templateData: emailData,
            cc: options?.cc,
            bcc: options?.bcc,
            attachments: options?.attachments,
          });
          
          results.success++;
          
        } catch (error) {
          logger.error('Failed to send bulk email to recipient:', {
            email: recipient.email,
            error: (error as Error).message,
          });
          results.failed++;
        }
      });

      await Promise.all(batchPromises);
      
      // Aguardar entre batches para evitar rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Bulk email sending completed', results);
    return results;
  }

  // Método para testar a configuração do email
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email connection test failed:', error as Error);
      return false;
    }
  }

  // Método para obter estatísticas do serviço
  getStats() {
    if (!this.transporter) {
      return {
        enabled: false,
        initialized: false,
        stats: null,
      };
    }

    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      stats: {
        host: this.config.host,
        port: this.config.port,
        from: this.config.from,
      },
    };
  }
}

// Exportar instância singleton
export const emailService = new EmailService();

// Função de conveniência para compatibilidade com importação existente
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: EmailAttachment[]
): Promise<boolean> => {
  return emailService.sendEmail({
    to: { email: to },
    subject,
    html,
    text,
    attachments,
  });
};