"use client";

import { useUser, SignIn } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // If the user is not loaded yet, show a loading state
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // If the user is not signed in, redirect to sign-in page
  if (!isSignedIn) {
    // We can either redirect to a sign-in page or show the sign-in component
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="p-8 bg-white dark:bg-black rounded-lg shadow-md">
          <SignIn />
        </div>
      </div>
    );
  }

  // If the user is signed in, render the protected content
  return children;
};

export default ProtectedRoute;