"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "Access denied. You do not have permission to sign in.",
  Verification: "The sign-in link is no longer valid. It may have been used already or it may have expired.",
  Default: "An error occurred during sign in. Please try again.",
  OAuthSignin: "Error in constructing an authorization URL.",
  OAuthCallback: "Error in handling the response from the OAuth provider.",
  OAuthCreateAccount: "Could not create OAuth provider user in the database.",
  EmailCreateAccount: "Could not create email provider user in the database.",
  Callback: "Error in the OAuth callback handler route.",
  OAuthAccountNotLinked: "The email on the account is already linked, but not with this OAuth account.",
  EmailSignin: "Check your email address. The email could not be sent.",
  CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "Please sign in to access this page.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  const errorMessage = error 
    ? errorMessages[error] || errorMessages.Default 
    : errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4">!</div>
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Authentication Error</h1>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        {error && (
          <p className="text-sm text-gray-400 mb-6">Error code: {error}</p>
        )}
        <a
          href="/auth/signin"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 w-full max-w-md text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
