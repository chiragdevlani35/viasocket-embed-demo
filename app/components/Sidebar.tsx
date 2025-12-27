'use client';

import { useRouter } from 'next/navigation';

interface SidebarProps {
  selectedUser?: string;
}

export default function Sidebar({ selectedUser }: SidebarProps) {
  const router = useRouter();

  const users = [
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' },
    { id: 'user3', name: 'User 3' },
  ];

  const handleUserSelect = (userId: string) => {
    router.push(`/?user=${userId}`);
  };

  return (
    <div className="w-[200px] h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h2>
      </div>
      <div className="flex-1 p-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserSelect(user.id)}
            className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
              selectedUser === user.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
}
