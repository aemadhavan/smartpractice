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
    const previewText = "Welcome to Smart Practise's waitlist!";
  
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
                  Thanks for your interest in Smart Practise! We're excited to have you join our waitlist 
                  for the Victorian Selective Entry High School Exam preparation platform.
                </Text>
                
                <Text className="mb-4 text-gray-600">
                  You'll be among the first to know when we launch and get exclusive early access to:
                </Text>
  
                <ul className="list-disc pl-6 mb-4 text-gray-600">
                  <li>AI-powered practice tests</li>
                  <li>Personalized learning insights</li>
                  <li>Comprehensive exam coverage</li>
                  <li>Real-time performance tracking</li>
                </ul>
  
                <Text className="mb-6 text-gray-600">
                  We'll keep you updated on our progress and let you know as soon as early access becomes available.
                </Text>
  
                <Button className="bg-purple-600 text-white px-6 py-3 rounded-md font-medium"
                  href="https://smartpractise.com/">
                  Learn More About Smart Practise
                </Button>
              </Section>
  
              {/* Social Proof */}
              <Section className="mb-8 bg-gray-50 p-6 rounded-lg">
                <Text className="text-center text-gray-600 font-medium">
                  Join hundreds of students already preparing smarter
                </Text>
                <div className="flex justify-center space-x-12 mt-4">
                  <div className="text-center">
                    <Text className="text-2xl font-bold text-purple-600">2000+</Text>
                    <Text className="text-sm text-gray-600">Practice Questions</Text>
                  </div>
                  <div className="text-center">
                    <Text className="text-2xl font-bold text-purple-600">95%</Text>
                    <Text className="text-sm text-gray-600">Student Satisfaction</Text>
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