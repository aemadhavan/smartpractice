'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setStatus('error');
      setMessage('No email provided');
      return;
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    try {
      setStatus('loading');
      const response = await fetch(`/api/waitlist?email=${encodeURIComponent(email!)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('You have been successfully unsubscribed.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (_) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-purple-600 mb-2">
            Smart Practise Waitlist
          </h1>
          <h2 className="text-xl text-gray-700">
            Unsubscribe Confirmation
          </h2>
        </div>

        {status === 'error' ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : status === 'success' ? (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              Are you sure you want to unsubscribe {email} from the Smart Practise waitlist?
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleUnsubscribe}
                disabled={status === 'loading'}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Processing...' : 'Confirm Unsubscribe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}