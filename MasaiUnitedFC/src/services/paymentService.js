import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { FIREBASE_COLLECTIONS, PAYMENT_STATUS } from '../utils/constants';
import { generateReceiptNumber, generateInvoiceNumber } from '../utils/helpers';
import moment from 'moment';

export const createInvoice = async (playerId, playerName, parentId, category, month, year, amount, dueDate) => {
  const invoiceNo = generateInvoiceNumber();
  const ref = await addDoc(collection(db, FIREBASE_COLLECTIONS.INVOICES), {
    invoiceNo,
    playerId,
    playerName,
    parentId,
    category,
    month,
    year,
    monthLabel: moment(`${year}-${month}-01`).format('MMMM YYYY'),
    amount,
    dueDate,
    status: PAYMENT_STATUS.UNPAID,
    paidAmount: 0,
    balance: amount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    remindersSent: 0,
    lastReminderAt: null,
  });
  return { id: ref.id, invoiceNo };
};

export const recordPayment = async (invoiceId, paymentData) => {
  const invoiceSnap = await getDoc(doc(db, FIREBASE_COLLECTIONS.INVOICES, invoiceId));
  if (!invoiceSnap.exists()) throw new Error('Invoice not found');

  const invoice = invoiceSnap.data();
  const receiptNo = generateReceiptNumber();
  const newPaidAmount = (invoice.paidAmount || 0) + paymentData.amount;
  const newBalance = invoice.amount - newPaidAmount;
  const newStatus = newBalance <= 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL;

  const paymentRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.PAYMENTS), {
    invoiceId,
    invoiceNo: invoice.invoiceNo,
    playerId: invoice.playerId,
    playerName: invoice.playerName,
    parentId: invoice.parentId,
    receiptNo,
    amount: paymentData.amount,
    method: paymentData.method || 'cash',
    reference: paymentData.reference || '',
    notes: paymentData.notes || '',
    month: invoice.month,
    year: invoice.year,
    monthLabel: invoice.monthLabel,
    recordedBy: paymentData.recordedBy,
    paidAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, FIREBASE_COLLECTIONS.INVOICES, invoiceId), {
    paidAmount: newPaidAmount,
    balance: Math.max(0, newBalance),
    status: newStatus,
    receiptNo: newStatus === PAYMENT_STATUS.PAID ? receiptNo : invoice.receiptNo,
    paidAt: newStatus === PAYMENT_STATUS.PAID ? serverTimestamp() : invoice.paidAt,
    updatedAt: serverTimestamp(),
  });

  return { paymentId: paymentRef.id, receiptNo, status: newStatus };
};

export const getPlayerInvoices = async (playerId, month = null, year = null) => {
  let q = query(
    collection(db, FIREBASE_COLLECTIONS.INVOICES),
    where('playerId', '==', playerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  let invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (month) invoices = invoices.filter((i) => i.month === month);
  if (year) invoices = invoices.filter((i) => i.year === year);

  return invoices;
};

export const getParentInvoices = async (parentId) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.INVOICES),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getUnpaidInvoices = async () => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.INVOICES),
    where('status', 'in', [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PARTIAL]),
    orderBy('dueDate')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllInvoices = async (month = null, year = null) => {
  let q = query(
    collection(db, FIREBASE_COLLECTIONS.INVOICES),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  let invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (month) invoices = invoices.filter((i) => i.month === parseInt(month));
  if (year) invoices = invoices.filter((i) => i.year === parseInt(year));

  return invoices;
};

export const getPaymentSummary = async (month, year) => {
  const invoices = await getAllInvoices(month, year);

  const summary = {
    totalInvoices: invoices.length,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    paid: 0,
    unpaid: 0,
    partial: 0,
    overdue: 0,
    collectionRate: 0,
  };

  invoices.forEach((inv) => {
    summary.totalAmount += inv.amount || 0;
    summary.paidAmount += inv.paidAmount || 0;
    summary.unpaidAmount += inv.balance || 0;

    if (inv.status === PAYMENT_STATUS.PAID) summary.paid++;
    else if (inv.status === PAYMENT_STATUS.UNPAID) summary.unpaid++;
    else if (inv.status === PAYMENT_STATUS.PARTIAL) summary.partial++;
    else if (inv.status === PAYMENT_STATUS.OVERDUE) summary.overdue++;
  });

  if (summary.totalAmount > 0) {
    summary.collectionRate = Math.round((summary.paidAmount / summary.totalAmount) * 100);
  }

  return summary;
};

export const markInvoiceOverdue = async (invoiceId) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.INVOICES, invoiceId), {
    status: PAYMENT_STATUS.OVERDUE,
    updatedAt: serverTimestamp(),
  });
};

export const incrementReminderCount = async (invoiceId) => {
  const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.INVOICES, invoiceId));
  const current = snap.data()?.remindersSent || 0;
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.INVOICES, invoiceId), {
    remindersSent: current + 1,
    lastReminderAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getPaymentsByPlayer = async (playerId) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.PAYMENTS),
    where('playerId', '==', playerId),
    orderBy('paidAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBulkPaymentReport = async (month, year) => {
  const invoices = await getAllInvoices(month, year);
  const byCategory = {};

  invoices.forEach((inv) => {
    if (!byCategory[inv.category]) {
      byCategory[inv.category] = {
        category: inv.category,
        total: 0,
        paid: 0,
        unpaid: 0,
        totalAmount: 0,
        paidAmount: 0,
      };
    }
    byCategory[inv.category].total++;
    byCategory[inv.category].totalAmount += inv.amount || 0;
    byCategory[inv.category].paidAmount += inv.paidAmount || 0;
    if (inv.status === PAYMENT_STATUS.PAID) byCategory[inv.category].paid++;
    else byCategory[inv.category].unpaid++;
  });

  return Object.values(byCategory);
};
