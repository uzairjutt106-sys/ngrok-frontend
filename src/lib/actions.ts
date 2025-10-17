'use server';

import { z } from 'zod';
import { addTransaction, getDailySummary, deleteTransaction } from './api';
import { revalidatePath } from 'next/cache';
import { DailySummaryResponse } from './types';

const transactionSchema = z.object({
  item_name: z.string().min(1, 'Please select an item.'),
  quantity_kg: z.coerce.number().positive('Quantity must be positive.'),
  purchase_rate: z.coerce.number().positive('Purchase rate must be positive.'),
  sale_rate: z.coerce.number().positive('Sale rate must be positive.'),
});

type TransactionFormState = {
  message: string;
  errors?: {
    item_name?: string[];
    quantity_kg?: string[];
    purchase_rate?: string[];
    sale_rate?: string[];
  };
  success: boolean;
};

export async function submitTransaction(
  prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const validatedFields = transactionSchema.safeParse({
    item_name: formData.get('item_name'),
    quantity_kg: formData.get('quantity_kg'),
    purchase_rate: formData.get('purchase_rate'),
    sale_rate: formData.get('sale_rate'),
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
    if (result.message) {
      revalidatePath('/');
      return { message: 'Transaction recorded successfully!', success: true };
    } else {
      return {
        message: 'Failed to record transaction. Please try again.',
        success: false,
      };
    }
  } catch (e: any) {
    return { message: e.message || 'An unexpected error occurred.', success: false };
  }
}

const reportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

type ReportState = {
  message?: string;
  summaries?: DailySummaryResponse;
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

  // Basic date validation
  if (new Date(validatedFields.data.endDate) < new Date(validatedFields.data.startDate)) {
    return { error: 'End date cannot be before start date.' };
  }

  try {
    const summaries = await getDailySummary(
      new Date(validatedFields.data.startDate),
      new Date(validatedFields.data.endDate)
    );
    if (summaries.rows.length === 0) {
      return { message: 'No data available for the selected period.' };
    }
    return { summaries };
  } catch (e) {
    return { error: 'Failed to generate report.' };
  }
}

type DeleteTransactionState = {
  message: string;
  success: boolean;
}

export async function deleteTransactionAction(prevState: DeleteTransactionState, formData: FormData): Promise<DeleteTransactionState> {
  const txId = formData.get('transaction_id');
  if (!txId) {
    return { message: 'Transaction ID is missing.', success: false };
  }

  try {
    const result = await deleteTransaction(Number(txId));
    if (result.message) {
      revalidatePath('/');
      return { message: 'Transaction deleted successfully!', success: true };
    } else {
      return { message: 'Failed to delete transaction.', success: false };
    }
  } catch (e: any) {
    return { message: e.message || 'An unexpected error occurred.', success: false };
  }
}
