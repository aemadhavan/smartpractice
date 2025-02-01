//src/app/sign-up/[...sign-up]/page.tsx

import Container from '@/components/Container'
import { SignUp } from '@clerk/nextjs'

export default function SignupPage() {
  return <Container><SignUp /></Container>
}