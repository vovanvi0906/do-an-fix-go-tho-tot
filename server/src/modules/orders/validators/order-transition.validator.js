import { ConflictException } from '@nestjs/common';
import {
  VALID_STATUS_TRANSITIONS,
  normalizeOrderStatus,
} from '../constants/order-status';

export class OrderTransitionValidator {
  static validateTransition(currentStatus, nextStatus) {
    const from = normalizeOrderStatus(currentStatus);
    const to = normalizeOrderStatus(nextStatus);
    if (!VALID_STATUS_TRANSITIONS[from]?.includes(to)) {
      throw new ConflictException(
        `INVALID_TRANSITION: ${currentStatus} -> ${nextStatus}`,
      );
    }
    return true;
  }
}
