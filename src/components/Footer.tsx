import Container from "@/components/Container";

export default function Footer() {
  return (
    <footer className="mt-12 mb-8">
        <Container>
            <div className="flex justify-between items-center gap-4">
                <p className="text-sm">Smart Practise &copy; {} {new Date().getFullYear()} All rights reserved.</p>
                <p className="text-sm">Created by Inner Sharp Consulting</p>
            </div>
        </Container>
    </footer>
  );
}