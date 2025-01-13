export default function Loading() {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-600 mb-2">
              Smart Practise Waitlist
            </h1>
            <h2 className="text-xl text-gray-700">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    );
  }