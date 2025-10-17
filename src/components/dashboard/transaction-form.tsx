'use client';

import { useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitTransaction } from '@/lib/actions';
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
  items: string[];
};

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Submitting...' : 'Record Transaction'}
      {!pending && <PlusCircle className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export default function TransactionForm({ items }: TransactionFormProps) {
  const [state, formAction] = useActionState(submitTransaction, initialState);
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
        <Label htmlFor="item_name">Item Name</Label>
        <Select name="item_name" required>
          <SelectTrigger id="item_name">
            <SelectValue placeholder="Select an item" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.item_name && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.item_name[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity_kg">Quantity (kg)</Label>
        <Input
          id="quantity_kg"
          name="quantity_kg"
          type="number"
          step="0.01"
          placeholder="e.g., 50.5"
          required
        />
        {state.errors?.quantity_kg && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.quantity_kg[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="purchase_rate">Purchase Rate (PKR/kg)</Label>
        <Input
          id="purchase_rate"
          name="purchase_rate"
          type="number"
          step="0.01"
          placeholder="e.g., 8.50"
          required
        />
        {state.errors?.purchase_rate && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.purchase_rate[0]}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="sale_rate">Sale Rate (PKR/kg)</Label>
        <Input
          id="sale_rate"
          name="sale_rate"
          type="number"
          step="0.01"
          placeholder="e.g., 12.00"
          required
        />
        {state.errors?.sale_rate && (
          <p className="pt-1 text-sm font-medium text-destructive">
            {state.errors.sale_rate[0]}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
