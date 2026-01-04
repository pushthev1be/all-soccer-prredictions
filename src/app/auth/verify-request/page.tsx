"use client";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Check Your Email</h1>
        <p className="text-gray-600">
          A sign-in link has been sent to your email address. Please check your inbox and click the link to sign in.
        </p>
      </div>
    </div>
  );
}
