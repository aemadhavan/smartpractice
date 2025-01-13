// emails/waitlist-confirmation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface WaitlistEmailProps {
  userEmail: string;
  unsubscribeUrl: string;
}

export const WaitlistConfirmationEmail = ({
  userEmail,
  unsubscribeUrl,
}: WaitlistEmailProps) => {
  const previewText = "Welcome to Smart Practise&apos;s waitlist!";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-8 px-4">
            {/* Logo/Header */}
            <Section className="mb-8 text-center">
              <Heading className="text-2xl font-bold text-purple-600">
                Smart Practise
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Heading className="text-xl mb-4 font-semibold text-gray-800">
                Thanks for joining our waitlist!
              </Heading>
              
              <Text className="mb-4 text-gray-600">
                Hi there,
              </Text>
              
              <Text className="mb-4 text-gray-600">
                Thanks for your interest in Smart Practise! We&apos;re excited to have you join our waitlist 
                for the Victorian Selective Entry High School Exam preparation platform.
              </Text>
              
              <Text className="mb-4 text-gray-600">
                As an early supporter, you&apos;ll get exclusive benefits when we launch:
              </Text>

              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Early access to our platform</li>
                <li>Special founding member pricing</li>
                <li>Priority support during exam preparation</li>
                <li>First access to new features</li>
              </ul>

              <Text className="mb-6 text-gray-600">
                We&apos;re working hard to create the best preparation experience for Victorian Selective Entry exams, 
                and we&apos;ll keep you updated on our progress.
              </Text>

              <Button 
                className="bg-purple-600 text-white px-6 py-3 rounded-md font-medium"
                href="https://smartpractise.com/"
              >
                Learn More About Smart Practise
              </Button>
            </Section>

            {/* Timeline Instead of Social Proof */}
            <Section className="mb-8 bg-gray-50 p-6 rounded-lg">
              <Text className="text-center font-medium text-gray-800 mb-4">
                What&apos;s Next?
              </Text>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Text className="text-purple-600 font-medium">1.</Text>
                  <Text className="text-gray-600">We&apos;ll send you regular updates on our development progress</Text>
                </div>
                <div className="flex items-start space-x-3">
                  <Text className="text-purple-600 font-medium">2.</Text>
                  <Text className="text-gray-600">You&apos;ll be first to know when early access is available</Text>
                </div>
                <div className="flex items-start space-x-3">
                  <Text className="text-purple-600 font-medium">3.</Text>
                  <Text className="text-gray-600">Get exclusive founding member benefits when we launch</Text>
                </div>
              </div>
            </Section>

            {/* Footer */}
            <Hr className="border-t border-gray-300 my-6" />
            
            <Section className="text-center text-gray-500 text-sm">
              <Text>
                This email was sent to {userEmail}
              </Text>
              <Text>
                Smart Practise, Melbourne, Victoria
              </Text>
              <Text>
                <Link href={unsubscribeUrl} className="text-purple-600 underline">
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WaitlistConfirmationEmail;