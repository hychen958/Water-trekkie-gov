import React, { useEffect, useState } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        const users = await response.json();
        setUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }
    fetchUsers();
  }, []);

  return (
    <ul>
      {users.map((user, index) => (
        <li key={index}>{`${user.username} - ${user.email}`}</li>
      ))}
    </ul>
  );
}

export default UserList;
