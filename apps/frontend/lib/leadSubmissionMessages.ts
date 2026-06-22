export {
  INVALID_INDIAN_PHONE_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  normalizeIndianMobile,
  isValidIndianMobile,
  validateIndianMobile,
  isValidLeadEmail,
  validateLeadEmail,
} from '@backend/lib/leadValidation';

export {
  DUPLICATE_LEAD_MESSAGE,
  SUCCESS_LEAD_MESSAGE,
} from '@backend/handlers/websiteLead';

export { SHEETS_UNAVAILABLE_MESSAGE } from '@backend/lib/googleSheetsLead';
