'use client';

import { useEffect, useEffectEvent, useState } from 'react';

// Declare global function from ViaSocket embed script
declare global {
  interface Window {
    openViasocket?: (flowId?: string) => void;
  }
}

interface Integration {
  id: string;
  title: string;
  status?: string;
  serviceIcons?: string[];
  action?: string;
  webhookurl?: string;
  description?: string;
}

interface ConnectedApp {
  auth_row_id: string;
  service_name: string;
  service_id: string;
  type: string;
  user_id: string;
  connection_label: string;
  updated_at: string;
  iconUrl: string;
  validActions: any[];
  isExpired: boolean;
  access_level_id: string;
  access_level_ids_list: string[];
  slug_name: string;
  meta_data: any;
  id: string;
}

interface FlowsSidebarProps {
  selectedUser?: string;
  jwtToken?: string;
}

export default function FlowsSidebar({ selectedUser, jwtToken }: FlowsSidebarProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [appsError, setAppsError] = useState<string>('');
  const [showConnectionsModal, setShowConnectionsModal] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isDeletingConnection, setIsDeletingConnection] = useState<string>('');

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

  const fetchConnectedApps = async () => {
    debugger
    if (!jwtToken) return;

    setIsLoadingApps(true);
    setAppsError('');
    
    try {
      const response = await fetch('https://flow-api.viasocket.com/embed/authentications', {
        method: 'GET',
        headers: {
          'Authorization': jwtToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectedApps(data?.data || []);
      } else {
        setAppsError(`Failed to fetch connected apps: ${response.status}`);
        setConnectedApps([]);
      }
    } catch (error) {
      console.error('Error fetching connected apps:', error);
      setAppsError('Error fetching connected apps');
      setConnectedApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  };


  function openEmbed(flowid?:string){
    const parentElement=document.getElementById(`viasocket-embed-${selectedUser}`)
    if(parentElement) parentElement.style.display='flex'
    
    // Call the global openViasocket function if it exists
    if (typeof window !== 'undefined' && window.openViasocket) {
      window.openViasocket(flowid)
    }
  }
  const handleAddNewIntegration = () => {
 openEmbed()
  };

  const handleIntegrationClick = (integrationId: string) => {
    // Set query param for specific integration
     openEmbed(integrationId)
  };

  const handleDeleteIntegration = async (integrationId: string, event: React.MouseEvent) => {
    // Prevent the click from bubbling up to the parent div
    event.stopPropagation();
    
    if (!jwtToken) {
      setError('No authorization token available');
      return;
    }

    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      const response = await fetch(`https://flow-api.viasocket.com/embed/updatestatus/${integrationId}?status=0`, {
        method: 'PUT',
        headers: {
          'Authorization': jwtToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the integration from the local state
        setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
        
        // Optionally show success message
        console.log('Integration deleted successfully');
      } else {
        const errorData = await response.text();
        setError(`Failed to delete integration: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      setError('Error deleting integration');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!jwtToken) {
      setAppsError('No authorization token available');
      return;
    }

    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    setIsDeletingConnection(connectionId);

    try {
      const response = await fetch(`https://flow-api.viasocket.com/embed/authentications/revoke/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': jwtToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the connection from the local state
        setConnectedApps(prev => prev.filter(app => app.id !== connectionId));
        console.log('Connection deleted successfully');
      } else {
        const errorData = await response.text();
        setAppsError(`Failed to delete connection: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      setAppsError('Error deleting connection');
    } finally {
      setIsDeletingConnection('');
    }
  };

  const handleShowConnections = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowConnectionsModal(true);
  };

  const getUniqueServices = () => {
    const serviceMap = new Map<string, ConnectedApp>();
    connectedApps.forEach(app => {
      if (!serviceMap.has(app.service_name)) {
        serviceMap.set(app.service_name, app);
      }
    });
    return Array.from(serviceMap.values());
  };

  const getConnectionsForService = (serviceName: string) => {
    return connectedApps.filter(app => app.service_name === serviceName);
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
    fetchConnectedApps();
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
      <div className="p-4 border-b flex items-center justify-between border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white ">
          Flows
        </h2>
        <button
          onClick={handleAddNewIntegration}
          className=" px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add
        </button>
      </div>
      
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
                className="p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer relative group"
              >
                <div className='flex items-center gap-2'>
                    <img src={integration?.serviceIcons?.[0]} style={{width:'24px'}} alt="" />
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1">
                  {integration.title || `Integration ${index + 1}`}
                </h3>
                    {integration.status !== 'deleted' && (
                      <button
                        onClick={(e) => handleDeleteIntegration(integration.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        title="Delete integration"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                    </div>
              
                {integration.status && (
                  <p className={`text-xs mt-1 ${
                    integration.status === 'deleted' 
                      ? 'text-red-600 dark:text-red-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Status: {integration.status}
                  </p>
                )}
        
              </div>
            ))}
          </div>
        )}
      
      {/* Connected Apps Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 px-2">
          Connected Apps
        </h3>
        
        {isLoadingApps ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Loading apps...</p>
          </div>
        ) : appsError ? (
          <div className="p-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
              <p className="text-xs text-red-600 dark:text-red-400">{appsError}</p>
            </div>
            <button
              onClick={fetchConnectedApps}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline px-2"
            >
              Retry
            </button>
          </div>
        ) : connectedApps.length === 0 ? (
          <div className="p-2 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              No connected apps
            </p>
          </div>
        ) : (
          <div className="p-2 overflow-y-auto">
            {getUniqueServices().map((app, index) => {
              const connections = getConnectionsForService(app.service_name);
              return (
                <div
                  key={app.service_id || index}
                  className="flex items-center gap-2 p-2 mb-1 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <img 
                    src={app.iconUrl} 
                    alt={app.service_name}
                    className="w-5 h-5 rounded-sm shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-gray-900 dark:text-white truncate flex-1">
                    {app.service_name}
                    {connections.length > 1 && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        ({connections.length} connections)
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleShowConnections(app.service_name)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5 rounded"
                    title="Manage connections"
                  >
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Connections Modal */}
        {showConnectionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedService} Connections
                </h3>
                <button
                  onClick={() => setShowConnectionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {getConnectionsForService(selectedService).map((connection) => {
                  let connectionLabel = '';
                  try {
                    const parsed = JSON.parse(connection.connection_label);
                    connectionLabel = parsed.Account || parsed.team || parsed.workspace || 'Connection';
                  } catch {
                    connectionLabel = 'Connection';
                  }
                  
                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={connection.iconUrl} 
                          alt={connection.service_name}
                          className="w-6 h-6 rounded-sm shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {connectionLabel}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {connection.type} • Updated {new Date(connection.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        disabled={isDeletingConnection === connection.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 p-1 rounded"
                        title="Delete connection"
                      >
                        {isDeletingConnection === connection.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
