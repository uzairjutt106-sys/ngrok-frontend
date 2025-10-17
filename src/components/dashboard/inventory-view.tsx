import type { InventoryItem as InventoryItemType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Boxes, Scale, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { placeholderImages } from '@/lib/placeholder-images';

type InventoryViewProps = {
  inventory: InventoryItemType[];
};

export default function InventoryView({ inventory }: InventoryViewProps) {
  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
        <Boxes className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Inventory Items</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a new scrap item using the form to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
      {inventory.map((item, index) => {
        const placeholder =
          placeholderImages[index % placeholderImages.length] ||
          placeholderImages[0];
        return (
          <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md">
            <div className="relative h-40 w-full">
              {placeholder && (
                <Image
                  src={placeholder.imageUrl}
                  alt={item.item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint={placeholder.imageHint}
                />
              )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <CardHeader className="-mt-14 z-10 relative text-primary-foreground">
              <CardTitle className="flex items-center gap-2 text-white">
                {item.item.name}
              </CardTitle>
              <CardDescription className="text-gray-300">
                Updated: {format(new Date(item.lastUpdated), 'PPP')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Weight
                </span>
                <span className="font-semibold">{item.weight.toFixed(2)} kgs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Value
                </span>
                <span className="font-semibold">
                  $
                  {item.currentValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
