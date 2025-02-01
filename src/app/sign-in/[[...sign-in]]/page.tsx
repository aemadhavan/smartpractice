//src/app/sign-in/[[...sign-in]]/page.tsx

import Container from '@/components/Container';
import { SignIn } from '@clerk/nextjs'

export default function SigninPage() {
  return <Container><SignIn /></Container>;
}