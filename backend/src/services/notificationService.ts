import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';

export interface NotificationPayload {
  recipient: string; // phone number or email
  message: string;
  orderReference?: string;
}

export interface INotificationChannel {
  send(payload: NotificationPayload): Promise<boolean>;
}

export class WhatsAppNotificationChannel implements INotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    // In MVP, operations team uses direct WhatsApp links/assistance.
    // This channel records the intended message for operational dispatch.
    Logger.info(`[WhatsApp Notification Dispatch] To: ${payload.recipient} | Ref: ${payload.orderReference ?? 'N/A'}`);
    return true;
  }

  generateDirectChatUrl(mobileNumber: string, prefilledText?: string): string {
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    const encodedText = prefilledText ? encodeURIComponent(prefilledText) : '';
    return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
  }
}

export class EmailNotificationChannel implements INotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    Logger.info(`[Email Notification Dispatch (Planned)] To: ${payload.recipient}`);
    return true;
  }
}

export class NotificationService {
  private whatsappChannel: WhatsAppNotificationChannel;
  private emailChannel: EmailNotificationChannel;

  constructor() {
    this.whatsappChannel = new WhatsAppNotificationChannel();
    this.emailChannel = new EmailNotificationChannel();
  }

  getWhatsAppChannel(): WhatsAppNotificationChannel {
    return this.whatsappChannel;
  }

  async notifyOrderReceived(customerMobile: string, orderRef: string, customerName: string): Promise<void> {
    const message = `Hello ${customerName}, we received your quote request (Ref: ${orderRef}) for materials in Nagpur. Our team will verify rates and contact you shortly.`;
    await this.whatsappChannel.send({
      recipient: customerMobile,
      message,
      orderReference: orderRef,
    });
  }

  getOperationalWhatsAppUrl(prefilledText?: string): string {
    return this.whatsappChannel.generateDirectChatUrl(config.business.whatsapp, prefilledText);
  }
}
