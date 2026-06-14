export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PARENT: 'parent',
};

export const PLAYER_CATEGORIES = ['U8', 'U10', 'U12', 'U15', 'U18'];

export const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

export const SESSION_TYPES = {
  TRAINING: 'training',
  MATCH: 'match',
  FRIENDLY: 'friendly',
  TOURNAMENT: 'tournament',
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CLUB_INFO = {
  name: 'Masai United FC',
  shortName: 'MUFC',
  founded: 2007,
  address: 'Masai, Johor, Malaysia',
  phone: '+60 XX-XXXX XXXX',
  email: 'info@masaiunitedfc.com',
  website: 'www.masaiunitedfc.com',
  bankName: 'Maybank',
  bankAccount: 'XXXX-XXXX-XXXX',
  bankAccountName: 'Masai United FC',
};

export const WHATSAPP_TEMPLATES = {
  PAYMENT_REMINDER: (playerName, amount, month, dueDate) =>
    `Salam, *Masai United FC* 🔴⚽\n\nPembayaran yuran untuk *${playerName}* bagi bulan *${month}* sebanyak *RM${amount}* masih belum dibuat.\n\nTarikh akhir: *${dueDate}*\n\nSila buat pembayaran melalui:\n🏦 Maybank: XXXX-XXXX-XXXX\n(${CLUB_INFO.bankAccountName})\n\nTerima kasih! 🙏`,

  PAYMENT_CONFIRMED: (playerName, amount, month, receiptNo) =>
    `✅ *Masai United FC*\n\nPembayaran diterima!\n\nPemain: *${playerName}*\nBulan: *${month}*\nJumlah: *RM${amount}*\nNo. Resit: *${receiptNo}*\n\nTerima kasih kerana membuat pembayaran tepat pada masanya! ⚽🔴`,

  BROADCAST: (message) =>
    `📢 *Masai United FC*\n\n${message}\n\n_Masai United FC - Together We Rise_ ⚽🔴`,

  ATTENDANCE_REPORT: (playerName, month, present, total) =>
    `📊 *Laporan Kehadiran - Masai United FC*\n\nPemain: *${playerName}*\nBulan: *${month}*\nKehadiran: *${present}/${total}* sesi\nPeratus: *${Math.round((present/total)*100)}%*\n\n⚽ Teruskan semangat!`,
};

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  PLAYERS: 'players',
  PARENTS: 'parents',
  ATTENDANCE: 'attendance',
  SESSIONS: 'sessions',
  PAYMENTS: 'payments',
  INVOICES: 'invoices',
  BROADCASTS: 'broadcasts',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
};
