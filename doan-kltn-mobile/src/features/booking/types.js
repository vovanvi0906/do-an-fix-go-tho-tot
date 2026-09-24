/**
 * Booking Feature — Type Definitions (JSDoc)
 * Tuân thủ quy tắc vibe-ui.md Mục 3: Định nghĩa domain types bằng JSDoc comments
 * Project mobile dùng thuần .jsx, không dùng TypeScript
 */

/**
 * @typedef {'INSTANT' | 'SCHEDULED'} BookingScheduleType
 */

/**
 * @typedef {'NORMAL' | 'EXPRESS'} BookingUrgency
 */

/**
 * @typedef {'IDLE' | 'SEARCHING' | 'FOUND' | 'TIMEOUT' | 'CANCELLED' | 'ERROR'} MatchingStatus
 */

/**
 * @typedef {'SEARCHING_WORKER' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED_PENDING_CONFIRMATION' | 'SETTLED' | 'CANCELLED' | 'REJECTED'} OrderStatus
 */

/**
 * @typedef {Object} ServiceItem
 * @property {string} id
 * @property {string} name
 * @property {number} basePrice
 * @property {string} icon
 * @property {string} unit
 * @property {string} desc
 */

/**
 * @typedef {Object} BookingFormData
 * @property {string} serviceId
 * @property {string} serviceName
 * @property {string} addressText
 * @property {number} lat
 * @property {number} lng
 * @property {string} note
 * @property {string[]} evidencePhotos - URI list from expo-image-picker
 * @property {BookingScheduleType} scheduleType
 * @property {Date|null} scheduledAt - null when INSTANT
 * @property {BookingUrgency} urgency
 * @property {string} proposedPrice
 * @property {string} voucherCode
 */

/**
 * @typedef {Object} CreateOrderPayload
 * @property {string} serviceId
 * @property {number} lat
 * @property {number} lng
 * @property {string} addressText
 * @property {string} note
 * @property {string[]} evidencePhotos
 * @property {BookingScheduleType} scheduleType
 * @property {string|null} scheduledAt - ISO string or null
 * @property {BookingUrgency} urgency
 * @property {number} proposedPrice
 * @property {string} voucherCode
 */

/**
 * @typedef {Object} AssignedWorkerInfo
 * @property {string} workerId
 * @property {string} fullName
 * @property {string} phone
 * @property {string} avatarUrl
 * @property {number} ratingAvg
 * @property {number} completedOrders
 */

/**
 * @typedef {Object} MatchingState
 * @property {MatchingStatus} status
 * @property {string|null} orderId
 * @property {number} remainingSeconds
 * @property {AssignedWorkerInfo|null} worker
 * @property {string} errorMessage
 */

export {};
