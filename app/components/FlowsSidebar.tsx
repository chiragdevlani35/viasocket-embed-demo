'use client';

import { useEffect, useEffectEvent, useState } from 'react';

interface Integration {
  id: string;
  title: string;
  status?: string;
  serviceIcons?: string[];
  action?: string;
  webhookurl?: string;
  description?: string;
}

interface FlowsSidebarProps {
  selectedUser?: string;
  jwtToken?: string;
}

export default function FlowsSidebar({ selectedUser, jwtToken }: FlowsSidebarProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchIntegrations = async () => {
    setIntegrations([])
    if (!jwtToken || !selectedUser) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://flow-api.viasocket.com/projects/projmGNWRpns/integrations', {
        method: 'GET',
        headers: {
          'authorization': jwtToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data?.data?.flows || []);
      } else {
        setError(`Failed to fetch integrations: ${response.status}`);
        setIntegrations([]);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setError('Error fetching integrations');
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  };


  function openEmbed(flowid?:string){
    const parentElement=document.getElementById(`viasocket-embed-${selectedUser}`)
    if(parentElement) parentElement.style.display='flex'
openViasocket(flowid)
  }
  const handleAddNewIntegration = () => {
 openEmbed()
  };

  const handleIntegrationClick = (integrationId: string) => {
    // Set query param for specific integration
     openEmbed(integrationId)
  };

  const listenToViasocket=useEffectEvent((e)=>{
        if (e.origin !== "https://embedfrontend.viasocket.com") return
    // Check if the message contains integration data
    if (e.data && e.data.id && e.data.title) {
      const integrationData = {
        id: e.data.id,
        title: e.data.title,
        status: e.data.status || 'active',
        serviceIcons: e.data.serviceIcons,
        action: e.data.action,
        webhookurl: e.data.webhookurl,
        description: e.data.description
      };

      setIntegrations(prevIntegrations => {
        // Check if integration already exists
        const existingIndex = prevIntegrations.findIndex(integration => integration.id === integrationData.id);
        
        if (existingIndex !== -1) {
          // Update existing integration
          const updatedIntegrations = [...prevIntegrations];
          updatedIntegrations[existingIndex] = { ...updatedIntegrations[existingIndex], ...integrationData };
          console.log('Updated existing integration:', integrationData.id);
          return updatedIntegrations;
        } else {
          // Add new integration to the beginning of the list
          console.log('Added new integration:', integrationData.id);
          return [integrationData, ...prevIntegrations];
        }
      });
    }
  })
  useEffect(() => {
    if (selectedUser && jwtToken) {
      fetchIntegrations();
      window.addEventListener('message',listenToViasocket)
    } else {
      setIntegrations([]);
      setError('');
    }
    return()=>{
         window.removeEventListener('message',listenToViasocket)
    }
  }, [selectedUser, jwtToken]);

  if (!selectedUser) {
    return (
      <div className="w-[250px] h-screen bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Flows</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Select a user to view their flows
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[250px] h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Flows for {selectedUser}
        </h2>
        <button
          onClick={handleAddNewIntegration}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add New Integration
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading flows...</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={fetchIntegrations}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : integrations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No integrations found
            </p>
          </div>
        ) : (
          <div className="p-2">
            {integrations.map((integration, index) => (
              <div
                key={integration.id || index}
                onClick={() => handleIntegrationClick(integration.id)}
                className="p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className='flex items-center gap-2'>
                    <img src={integration?.serviceIcons?.[0]} style={{width:'24px'}} alt="" />
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {integration.title || `Integration ${index + 1}`}
                </h3>
                    </div>
              
                {integration.status && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Status: {integration.status}
                  </p>
                )}
        
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
