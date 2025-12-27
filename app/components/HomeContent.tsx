import { useSearchParams } from 'next/navigation';
import {  useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import FlowsSidebar from './FlowsSidebar';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const selectedUser = searchParams.get('user');
  const [jwtToken, setJwtToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  const generateToken = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setJwtToken(data.token);
      } else {
        console.error('Failed to generate token');
        setJwtToken('');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      setJwtToken('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      generateToken(selectedUser);
    } else {
      setJwtToken('');
    }
  }, [selectedUser]);

  // Load ViaSocket embed script when user and token are available
  useEffect(() => {
    if (selectedUser && jwtToken) {
      setScriptLoaded(false);
      
      // Reset embed div display to none when user changes
      const embedDiv = document.getElementById(`viasocket-embed-${selectedUser}`);
      if (embedDiv) {
        embedDiv.style.display = 'none';
      }
      
      // Remove any existing script
      const existingScript = document.getElementById('viasocket-embed-main-script');
      if (existingScript) {
        existingScript.remove();
      }

      // Create and append new script
      const script = document.createElement('script');
      script.id = 'viasocket-embed-main-script';
      script.src = 'https://embed.viasocket.com/prod-embedcomponent.js';
      script.setAttribute('embedToken', jwtToken);
      
      // Handle script load event
      script.onload = () => {
        setScriptLoaded(true);
      };
      
      // Append to the specific embed div
      if (embedDiv) {
        embedDiv.appendChild(script);
      }
    }
  }, [selectedUser, jwtToken]);



  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <Sidebar selectedUser={selectedUser || undefined} />
      <FlowsSidebar selectedUser={selectedUser || undefined} jwtToken={jwtToken} />
      
      <div className="flex-1 p-4">
        {selectedUser ? (
          <div 
            id={`viasocket-embed-${selectedUser}`}
            style={{display:"none"}}
            className="w-full h-full min-h-[600px]  bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {/* ViaSocket embed will load here */}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to ViaSocket Demo
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Please select a user from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}