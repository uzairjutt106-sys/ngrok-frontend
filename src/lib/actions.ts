'use server';

import { z } from 'zod';
import { addTransaction, getDailySummary } from './api';
import { revalidatePath } from 'next/cache';
import type { DailySummary } from './types';

const transactionSchema = z.object({
  itemId: z.string().min(1, 'Please select an item.'),
  weight: z.coerce.number().positive('Weight must be a positive number.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
});

type TransactionFormState = {
  message: string;
  errors?: {
    itemId?: string[];
    weight?: string[];
    price?: string[];
  };
  success: boolean;
};

export async function submitTransaction(
  prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const validatedFields = transactionSchema.safeParse({
    itemId: formData.get('itemId'),
    weight: formData.get('weight'),
    price: formData.get('price'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid data. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const result = await addTransaction(validatedFields.data);
    if (result.success) {
      revalidatePath('/');
      return { message: 'Transaction added successfully!', success: true };
    } else {
      return {
        message: 'Failed to add transaction. Item not found.',
        success: false,
      };
    }
  } catch (e) {
    return { message: 'An unexpected error occurred.', success: false };
  }
}

const reportSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

type ReportState = {
  message?: string;
  summaries?: DailySummary[];
  error?: string;
};

export async function generateReport(
  prevState: ReportState,
  formData: FormData
): Promise<ReportState> {
  const startDate = formData.get('startDate');
  const endDate = formData.get('endDate');

  if (!startDate || !endDate) {
    return { error: 'Please select both a start and end date.' };
  }

  const validatedFields = reportSchema.safeParse({
    startDate: startDate,
    endDate: endDate,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid date format.' };
  }

  if (validatedFields.data.endDate < validatedFields.data.startDate) {
    return { error: 'End date cannot be before start date.' };
  }

  try {
    const summaries = await getDailySummary(
      validatedFields.data.startDate,
      validatedFields.data.endDate
    );
    if (summaries.length === 0) {
      return { message: 'No data available for the selected period.' };
    }
    return { summaries };
  } catch (e) {
    return { error: 'Failed to generate report.' };
  }
}
