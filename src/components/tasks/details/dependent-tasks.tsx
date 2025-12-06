'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { encryptId } from '@/utils/aes-security-encryption';

export default function TaskDependencies({
  preceding,
  succeeding,
}: {
  preceding: { id: string; title: string }[];
  succeeding: { id: string; title: string }[];
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-base">Task Dependencies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h4 className="font-semibold">Preceding Tasks</h4>
          </div>
          {preceding.length ? (
            <div className="flex flex-col divide-y divide-border/50 rounded-md border border-border/50 bg-background/50">
              {preceding?.map((t) => (
                <>
                  <Link
                    aria-label={`Open task ${t.title}`}
                    className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/tasks/${encryptId(t.id)}`}
                  >
                    <span className="truncate text-primary group-hover:underline">
                      {t.title}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                  </Link>
                </>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">None</p>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="font-semibold">Succeeding Tasks</h4>
          </div>
          {succeeding.length ? (
            <div className="flex flex-col divide-y divide-border/50 rounded-md border border-border/50 bg-background/50">
              {succeeding?.map((t) => (
                <>
                  <Link
                    aria-label={`Open task ${t.title}`}
                    className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/tasks/${encryptId(t.id)}`}
                  >
                    <span className="truncate text-primary group-hover:underline">
                      {t.title}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                  </Link>
                </>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">None</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
