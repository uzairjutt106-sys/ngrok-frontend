'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitTransaction } from '@/lib/actions';
import type { Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TransactionFormProps = {
  items: Item[];
};

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Adding Item...' : 'Add Item'}
      {!pending && <PlusCircle className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export default function TransactionForm({ items }: TransactionFormProps) {
  const [state, formAction] = useFormState(submitTransaction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        formRef.current?.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            state.message || 'An error occurred. Please check your input.',
        });
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="itemId">Item Type</Label>
        <Select name="itemId" required>
          <SelectTrigger id="itemId">
            <SelectValue placeholder="Select a scrap type" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.itemId && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.itemId[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="weight">Weight (kgs)</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.01"
          placeholder="e.g., 50.5"
          required
        />
        {state.errors?.weight && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.weight[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Purchase Price ($)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          placeholder="e.g., 120.75"
          required
        />
        {state.errors?.price && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.price[0]}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
