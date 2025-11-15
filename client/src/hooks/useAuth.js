import { useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import axios from 'axios';

export const useAuth = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useClerkAuth();

  useEffect(() => {
    const syncUserToBackend = async () => {
      if (isSignedIn && user && isLoaded) {
        try {
          // Get Clerk session token
          const token = await getToken();
          
          // Extract user data from Clerk
          const userData = {
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            profileImage: user.imageUrl || '',
          };

          console.log('Syncing user to backend:', userData);

          // Sync to backend
          const response = await axios.post(
            'http://localhost:5000/api/users/auth/signin-signup',
            userData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('User synced to backend successfully:', response.data);
        } catch (error) {
          console.error('Error syncing user to backend:', error.response?.data || error.message);
        }
      }
    };

    syncUserToBackend();
  }, [isSignedIn, user, isLoaded, getToken]);

  return { isSignedIn, user, isLoaded };
};
