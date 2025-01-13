//import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Container from "./Container";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="mt-8 mb-12">
      <Container>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src="/sp-logo.png" alt="Logo" width={130} height={130} />
            </Link>                    
            {/* <SignedIn>                        
            </SignedIn> */}
          </div>                
          <div className="flex justify-between">
            <div className="text-gray-500 bolder text-sm">Sign in (coming soon)</div>
            {/* <SignedOut>
                <SignInButton  />
            </SignedOut>
            <SignedIn>
                <UserButton />
            </SignedIn> */}
          </div>                
        </div>
      </Container>
    </header>
  );
}