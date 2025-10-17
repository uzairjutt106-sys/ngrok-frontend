import type { Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Boxes } from 'lucide-react';
import { format } from 'date-fns';
import DeleteTransactionDialog from './delete-transaction-dialog';

type InventoryViewProps = {
  transactions: Transaction[];
};

export default function InventoryView({ transactions }: InventoryViewProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
        <Boxes className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Transactions Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Record a new transaction using the form to see it here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Quantity (kg)</TableHead>
          <TableHead className="text-right">Purchase Rate</TableHead>
          <TableHead className="text-right">Sale Rate</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>
              {format(new Date(tx.transaction_date + 'T00:00:00'), 'PPP')}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{tx.item_name}</Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {tx.quantity_kg.toFixed(2)}
            </TableCell>
            <TableCell className="text-right text-green-600">
              PKR {tx.purchase_rate.toFixed(2)}
            </TableCell>
            <TableCell className="text-right text-blue-600">
              PKR {tx.sale_rate.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <DeleteTransactionDialog transactionId={tx.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
