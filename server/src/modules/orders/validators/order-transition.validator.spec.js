import { OrderTransitionValidator } from './order-transition.validator';
import { normalizeOrderStatus } from '../constants/order-status';

describe('Order FSM canonical states and wire compatibility', () => {
  it.each([
    ['SEARCHING', 'ASSIGNED'],
    ['SEARCHING_WORKER', 'MATCHED'],
    ['ASSIGNED', 'WORKER_ARRIVING'],
    ['MATCHED', 'WORKER_EN_ROUTE'],
    ['WORKER_ARRIVING', 'ARRIVED'],
    ['ARRIVED', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'AWAITING_CONFIRMATION'],
    ['IN_PROGRESS', 'AWAITING_ACCEPTANCE'],
    ['AWAITING_CONFIRMATION', 'AWAITING_PAYMENT'],
    ['AWAITING_PAYMENT', 'COMPLETED'],
    ['AWAITING_ACCEPTANCE', 'DISPUTED'],
    ['MATCHED', 'CANCELLED'],
  ])('allows %s -> %s', (from, to) => {
    expect(OrderTransitionValidator.validateTransition(from, to)).toBe(true);
  });
  it.each([
    ['MATCHED', 'IN_PROGRESS'],
    ['WORKER_EN_ROUTE', 'AWAITING_ACCEPTANCE'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['AWAITING_ACCEPTANCE', 'PAID'],
    ['COMPLETED', 'IN_PROGRESS'],
    ['PAID', 'CANCELLED'],
    ['CANCELLED', 'SEARCHING'],
    ['DISPUTED', 'COMPLETED'],
    ['UNKNOWN', 'IN_PROGRESS'],
    ['ARRIVED', 'ANY_STATUS'],
  ])('rejects %s -> %s', (from, to) => {
    expect(() => OrderTransitionValidator.validateTransition(from, to)).toThrow(
      'INVALID_TRANSITION',
    );
  });
  it('does not collapse ARRIVED into working or acceptance into payment', () => {
    expect(normalizeOrderStatus('ARRIVED')).toBe('ARRIVED');
    expect(normalizeOrderStatus('AWAITING_CONFIRMATION')).toBe(
      'AWAITING_ACCEPTANCE',
    );
    expect(normalizeOrderStatus('PAID')).toBe('COMPLETED');
  });
});
