// src/app/vocabulary/layout.tsx
export default function VocabularyLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }