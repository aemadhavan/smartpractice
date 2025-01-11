import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Container from "./Container";
import Link from "next/link";
import { OrganizationSwitcher } from "@clerk/nextjs";


export default function Header() {
  return (
    <header className="mt-8 mb-12">
        <Container>
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                <p className="font-bold"><Link href="/questions">Smart Practise</Link></p>                    
                    <SignedIn>                        
                    </SignedIn>
                </div>                
                <div className="flex justify-between">
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>                
            </div>
        </Container>
    </header>
  );
}