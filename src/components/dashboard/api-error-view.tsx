'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ApiErrorView() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Card className="w-[450px] shadow-lg">
        <CardHeader className="items-center text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl font-bold text-destructive">
            API Connection Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            The application could not connect to the backend service. Please
            check your network connection and ensure the API is running.
          </p>
          <Button onClick={handleReload} size="lg">
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
