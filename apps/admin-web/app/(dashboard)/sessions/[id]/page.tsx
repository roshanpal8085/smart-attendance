'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, useSessionRecords, useEndSession } from '@/hooks/useSessions';
import { LiveSession } from '@/components/sessions/LiveSession';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SessionLivePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: session, isLoading: isSessionLoading } = useSession(id);
  const { data: records = [], isLoading: isRecordsLoading } = useSessionRecords(id);
  const endSessionMutation = useEndSession();

  const handleEndSession = async (sessionId: string) => {
    await endSessionMutation.mutateAsync(sessionId);
    router.push('/sessions');
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link href="/sessions" className="inline-flex items-center gap-1.5 text-sm text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Sessions
        </Link>
        <Card className="p-8 text-center">
          <p className="text-slate-600 font-medium">Session not found or has been removed.</p>
        </Card>
      </div>
    );
  }

  return (
    <LiveSession
      session={session}
      initialRecords={records}
      onEndSession={handleEndSession}
      isEnding={endSessionMutation.isPending}
    />
  );
}
