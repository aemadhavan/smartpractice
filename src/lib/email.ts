// lib/email.ts
import { Resend } from 'resend';
import { WaitlistConfirmationEmail } from '../emails/waitlist-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWaitlistConfirmationEmail(email: string) {
  try {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
    
    const data = await resend.emails.send({
      from: 'Smart Practise <hello@mail.smartpractise.com>',
      to: email,
      subject: 'Welcome to Smart Practise Waitlist!',
      react: WaitlistConfirmationEmail({
        userEmail: email,
        unsubscribeUrl: unsubscribeUrl,
      }) as React.ReactElement,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send waitlist confirmation email:', error);
    return { success: false, error };
  }
}