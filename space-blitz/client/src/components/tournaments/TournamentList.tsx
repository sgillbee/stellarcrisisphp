import React, { useState, useEffect } from 'react';
import { Tournament } from '../../types/game';
import './TournamentList.css';

interface TournamentListProps {
  onTournamentSelect?: (tournamentId: string) => void;
  onCreateTournament?: () => void;
}

const TournamentList: React.FC<TournamentListProps> = ({
  onTournamentSelect,
  onCreateTournament
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/tournaments');
      // const data = await response.json();

      // Mock data for now
      const mockTournaments: Tournament[] = [
        {
          _id: 'tournament1',
          name: 'Winter Championship 2025',
          series: 'Championship Series',
          status: 'active',
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-02-15'),
          maxPlayers: 16,
          currentPlayers: 12,
          prizePool: 1000,
          createdAt: new Date('2024-12-01'),
          updatedAt: new Date('2025-01-10')
        },
        {
          _id: 'tournament2',
          name: 'Spring Qualifier',
          series: 'Qualifier Series',
          status: 'upcoming',
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-03-31'),
          maxPlayers: 32,
          currentPlayers: 8,
          prizePool: 500,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-05')
        },
        {
          _id: 'tournament3',
          name: 'Autumn Classic 2024',
          series: 'Classic Series',
          status: 'completed',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-10-01'),
          maxPlayers: 8,
          currentPlayers: 8,
          prizePool: 250,
          winner: 'PlayerChampion',
          createdAt: new Date('2024-08-01'),
          updatedAt: new Date('2024-10-01')
        }
      ];

      setTournaments(mockTournaments);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'all') return true;
    return tournament.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'upcoming': return '#ffc107';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading tournaments...</div>;
  }

  return (
    <div className="tournament-list">
      <div className="tournament-header">
        <h2>Tournaments</h2>
        <div className="tournament-controls">
          <div className="filter-controls">
            <label>
              Filter:
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
              >
                <option value="all">All Tournaments</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
          {onCreateTournament && (
            <button
              className="btn btn-primary"
              onClick={onCreateTournament}
            >
              Create Tournament
            </button>
          )}
        </div>
      </div>

      <div className="tournaments-grid">
        {filteredTournaments.length === 0 ? (
          <div className="no-tournaments">
            <p>No tournaments found matching the current filter.</p>
          </div>
        ) : (
          filteredTournaments.map(tournament => (
            <div
              key={tournament._id}
              className="tournament-card"
              onClick={() => onTournamentSelect?.(tournament._id)}
            >
              <div className="tournament-card-header">
                <h3>{tournament.name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(tournament.status) }}
                >
                  {tournament.status}
                </span>
              </div>

              <div className="tournament-info">
                <div className="info-item">
                  <span className="label">Series:</span>
                  <span className="value">{tournament.series}</span>
                </div>
                <div className="info-item">
                  <span className="label">Players:</span>
                  <span className="value">
                    {tournament.currentPlayers}/{tournament.maxPlayers}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Prize Pool:</span>
                  <span className="value">${tournament.prizePool}</span>
                </div>
                <div className="info-item">
                  <span className="label">Start:</span>
                  <span className="value">{formatDate(tournament.startDate)}</span>
                </div>
                {tournament.winner && (
                  <div className="info-item">
                    <span className="label">Winner:</span>
                    <span className="value winner">{tournament.winner}</span>
                  </div>
                )}
              </div>

              <div className="tournament-actions">
                <button className="btn btn-secondary btn-small">
                  View Details
                </button>
                {tournament.status === 'upcoming' && (
                  <button className="btn btn-primary btn-small">
                    Join Tournament
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentList;