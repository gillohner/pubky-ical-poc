"use client";

import { Button } from "@/components/ui/button";
import { useExampleStore } from "@/stores/example-store";

export function ExampleCounter() {
  const { count, message, increment, decrement, reset } = useExampleStore();

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg shadow-sm bg-white dark:bg-neutral-900">
      <h2 className="text-2xl font-bold">{message}</h2>
      <div className="text-4xl font-mono">{count}</div>
      <div className="flex gap-2">
        <Button onClick={decrement} variant="outline">
          Decrement
        </Button>
        <Button onClick={increment}>
          Increment
        </Button>
        <Button onClick={reset} variant="secondary">
          Reset
        </Button>
      </div>
    </div>
  );
}
