import moment from 'moment';

export const formatCurrency = (amount) => {
  return `RM ${parseFloat(amount || 0).toFixed(2)}`;
};

export const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return '-';
  return moment(date?.toDate ? date.toDate() : date).format(format);
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return moment(date?.toDate ? date.toDate() : date).format('DD MMM YYYY, hh:mm A');
};

export const getMonthYear = (date = new Date()) => {
  return moment(date).format('MMMM YYYY');
};

export const getCurrentMonth = () => moment().format('MMMM');
export const getCurrentYear = () => moment().year();

export const calculateAge = (dob) => {
  return moment().diff(moment(dob), 'years');
};

export const getAttendancePercentage = (present, total) => {
  if (!total) return 0;
  return Math.round((present / total) * 100);
};

export const getAttendanceColor = (percentage) => {
  if (percentage >= 80) return '#28A745';
  if (percentage >= 60) return '#FFC107';
  return '#DC3545';
};

export const generateReceiptNumber = () => {
  const prefix = 'MUFC';
  const date = moment().format('YYYYMM');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${date}-${random}`;
};

export const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const date = moment().format('YYYYMM');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${date}-${random}`;
};

export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid': return '#28A745';
    case 'unpaid': return '#DC3545';
    case 'partial': return '#FFC107';
    case 'overdue': return '#FF5722';
    default: return '#ADB5BD';
  }
};

export const getPaymentStatusLabel = (status) => {
  switch (status) {
    case 'paid': return 'Paid';
    case 'unpaid': return 'Unpaid';
    case 'partial': return 'Partial';
    case 'overdue': return 'Overdue';
    default: return 'Unknown';
  }
};

export const getCategoryAgeRange = (category) => {
  switch (category) {
    case 'U8': return 'Ages 6-8';
    case 'U10': return 'Ages 9-10';
    case 'U12': return 'Ages 11-12';
    case 'U15': return 'Ages 13-15';
    case 'U18': return 'Ages 16-18';
    default: return '';
  }
};

export const openWhatsApp = async (phone, message) => {
  const { Linking } = require('react-native');
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(message);
  const url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
  const webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (err) {
    console.error('WhatsApp error:', err);
  }
};

export const sanitizePhone = (phone) => {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+60' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+60' + cleaned;
  }
  return cleaned;
};

export const getDaysInMonth = (month, year) => {
  return moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
};

export const getWeeksInMonth = (month, year) => {
  const start = moment(`${year}-${month}-01`, 'YYYY-MM-DD');
  const end = moment(start).endOf('month');
  let count = 0;
  let current = start.clone();
  while (current <= end) {
    if (current.day() === 6 || current.day() === 0) count++;
    current.add(1, 'day');
  }
  return Math.ceil(count / 2);
};
