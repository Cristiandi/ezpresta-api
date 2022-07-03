import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

export const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const addMinutes = (date: Date, minutes: number) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const subtractMinutes = (date: Date, minutes: number) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - minutes);
  return result;
};

export const getNumberOfDays = (startDate: Date, endDate: Date) => {
  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  // Calculating the time difference between two dates
  const diffInTime = endDate.getTime() - startDate.getTime();

  // Calculating the no. of days between two dates
  const diffInDays = Math.round(diffInTime / oneDay);

  return diffInDays;
};

// function to format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(value);
};

export const getRabbitMQExchangeName = () => {
  return `${process.env.NODE_ENV}_${process.env.RABBITMQ_EXCHANGE}`;
};

export const hash = (text: string): string => {
  const hash = crypto.createHash('sha256').update(text).digest('hex');

  return hash;
};
