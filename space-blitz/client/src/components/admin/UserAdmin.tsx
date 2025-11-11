import React, { useState, useEffect } from 'react';
import './UserAdmin.css';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'player';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  gamesPlayed: number;
  tournamentsWon: number;
}

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'player'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockUsers: User[] = [
        {
          _id: 'user1',
          username: 'admin',
          email: 'admin@spaceblitz.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date('2025-01-10T14:30:00'),
          createdAt: new Date('2024-01-01'),
          gamesPlayed: 150,
          tournamentsWon: 12
        },
        {
          _id: 'user2',
          username: 'moderator1',
          email: 'mod1@spaceblitz.com',
          role: 'moderator',
          isActive: true,
          lastLogin: new Date('2025-01-09T10:15:00'),
          createdAt: new Date('2024-03-15'),
          gamesPlayed: 89,
          tournamentsWon: 3
        },
        {
          _id: 'user3',
          username: 'player1',
          email: 'player1@email.com',
          role: 'player',
          isActive: true,
          lastLogin: new Date('2025-01-08T16:45:00'),
          createdAt: new Date('2024-06-20'),
          gamesPlayed: 45,
          tournamentsWon: 1
        },
        {
          _id: 'user4',
          username: 'inactive_player',
          email: 'inactive@email.com',
          role: 'player',
          isActive: false,
          lastLogin: new Date('2024-12-15T09:20:00'),
          createdAt: new Date('2024-08-10'),
          gamesPlayed: 12,
          tournamentsWon: 0
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    setUsers(prev => prev.map(user =>
      user._id === userId ? { ...user, role: newRole } : user
    ));
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user =>
      user._id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#ffc107';
      case 'player': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-admin">
      <div className="admin-header">
        <h2>User Management</h2>
        <div className="user-stats">
          <span className="stat">Total: {users.length}</span>
          <span className="stat">Active: {users.filter(u => u.isActive).length}</span>
          <span className="stat">Admins: {users.filter(u => u.role === 'admin').length}</span>
        </div>
      </div>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="player">Players</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Games Played</th>
              <th>Tournaments Won</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td className="username">{user.username}</td>
                <td className="email">{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value as User['role'])}
                    className="role-select"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    <option value="player">Player</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="last-login">{formatDate(user.lastLogin)}</td>
                <td className="stats">{user.gamesPlayed}</td>
                <td className="stats">{user.tournamentsWon}</td>
                <td className="actions">
                  <button
                    className={`btn ${user.isActive ? 'btn-danger' : 'btn-success'} btn-small`}
                    onClick={() => toggleUserStatus(user._id)}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>No users found matching the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAdmin;