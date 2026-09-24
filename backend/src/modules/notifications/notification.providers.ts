import {
  INotification,
  INotificationProvider,
  NotificationChannel,
  NotificationProviderResult,
} from './notification.types.js';
import { logger } from '../../lib/logger.js';

export class InAppNotificationProvider implements INotificationProvider {
  channel = NotificationChannel.IN_APP;

  async send(notification: INotification): Promise<NotificationProviderResult> {
    // In-app notifications are persisted directly in MongoDB and ready for immediate client consumption
    return {
      success: true,
      provider: 'IN_APP_LOCAL',
      providerMessageId: notification._id ? notification._id.toString() : `inapp-${Date.now()}`,
    };
  }
}

export class MockEmailNotificationProvider implements INotificationProvider {
  channel = NotificationChannel.EMAIL;

  async send(notification: INotification): Promise<NotificationProviderResult> {
    logger.info(
      {
        channel: 'EMAIL',
        userId: notification.userId?.toString(),
        type: notification.type,
        title: notification.title,
      },
      '[MockEmailNotificationProvider] Simulated email delivery'
    );

    return {
      success: true,
      provider: 'MOCK_EMAIL_SERVICE',
      providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
  }
}

export class MockSmsNotificationProvider implements INotificationProvider {
  channel = NotificationChannel.SMS;

  async send(notification: INotification): Promise<NotificationProviderResult> {
    logger.info(
      {
        channel: 'SMS',
        userId: notification.userId?.toString(),
        type: notification.type,
        title: notification.title,
      },
      '[MockSmsNotificationProvider] Simulated SMS delivery'
    );

    return {
      success: true,
      provider: 'MOCK_SMS_GATEWAY',
      providerMessageId: `mock-sms-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
  }
}

export class NotificationProviderFactory {
  private static providers: Map<NotificationChannel, INotificationProvider> = new Map([
    [NotificationChannel.IN_APP, new InAppNotificationProvider()],
    [NotificationChannel.EMAIL, new MockEmailNotificationProvider()],
    [NotificationChannel.SMS, new MockSmsNotificationProvider()],
  ]);

  static getProvider(channel: NotificationChannel): INotificationProvider {
    const provider = this.providers.get(channel);
    if (!provider) {
      // Fallback to in-app provider
      return this.providers.get(NotificationChannel.IN_APP)!;
    }
    return provider;
  }

  static registerProvider(channel: NotificationChannel, provider: INotificationProvider): void {
    this.providers.set(channel, provider);
  }
}
