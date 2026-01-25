import { connect, Connection, Channel } from 'amqplib';
import { logger } from './logger';

export interface QueueMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected: boolean = false;

  constructor(private url: string = process.env.RABBITMQ_URL || 'amqp://localhost:5672') {}

  async connect(): Promise<void> {
    try {
      this.connection = await connect(this.url);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      logger.info('Connected to RabbitMQ successfully');

      // Configurar exchanges e queues principais
      await this.setupQueues();

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    // Exchange para tasks
    await this.channel.assertExchange('tasks', 'direct', { durable: true });
    
    // Queue para emails
    await this.channel.assertQueue('email_queue', { durable: true });
    await this.channel.bindQueue('email_queue', 'tasks', 'email');

    // Queue para notificações
    await this.channel.assertQueue('notification_queue', { durable: true });
    await this.channel.bindQueue('notification_queue', 'tasks', 'notification');

    // Queue para relatórios
    await this.channel.assertQueue('report_queue', { durable: true });
    await this.channel.bindQueue('report_queue', 'tasks', 'report');
  }

  async publishMessage(exchange: string, routingKey: string, message: QueueMessage): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      return this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  async consumeMessages(queue: string, callback: (message: QueueMessage) => Promise<void>): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const message: QueueMessage = JSON.parse(msg.content.toString());
            await callback(message);
            this.channel!.ack(msg);
          } catch (error) {
            logger.error('Error processing message:', error);
            this.channel!.nack(msg, false, false); // Não recolocar na queue
          }
        }
      });
    } catch (error) {
      logger.error('Failed to consume messages:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.off;
      this.isConnected = false;
    }
  }
}

export const rabbitMQService = new RabbitMQService();