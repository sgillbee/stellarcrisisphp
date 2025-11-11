import React, { useState, useEffect } from 'react';
import { Tournament } from '../../types/game';
import './TournamentBracket.css';

interface TournamentEntrant {
  _id: string;
  name: string;
  seed?: number;
  status: 'active' | 'eliminated' | 'winner';
}

interface Match {
  _id: string;
  round: number;
  player1?: TournamentEntrant;
  player2?: TournamentEntrant;
  winner?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TournamentBracketProps {
  tournament: Tournament;
  onMatchClick?: (matchId: string) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onMatchClick
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateBracket();
  }, [tournament]);

  const generateBracket = () => {
    setLoading(true);

    // Mock bracket generation - in a real app, this would come from the API
    const mockEntrants: TournamentEntrant[] = [
      { _id: 'p1', name: 'Player One', seed: 1, status: 'active' },
      { _id: 'p2', name: 'Player Two', seed: 2, status: 'active' },
      { _id: 'p3', name: 'Player Three', seed: 3, status: 'active' },
      { _id: 'p4', name: 'Player Four', seed: 4, status: 'active' },
      { _id: 'p5', name: 'Player Five', seed: 5, status: 'active' },
      { _id: 'p6', name: 'Player Six', seed: 6, status: 'active' },
      { _id: 'p7', name: 'Player Seven', seed: 7, status: 'active' },
      { _id: 'p8', name: 'Player Eight', seed: 8, status: 'active' },
    ];

    // Generate matches for a single-elimination bracket
    const mockMatches: Match[] = [
      // Round 1
      {
        _id: 'm1',
        round: 1,
        player1: mockEntrants[0],
        player2: mockEntrants[7],
        winner: 'p1',
        status: 'completed'
      },
      {
        _id: 'm2',
        round: 1,
        player1: mockEntrants[1],
        player2: mockEntrants[6],
        winner: 'p2',
        status: 'completed'
      },
      {
        _id: 'm3',
        round: 1,
        player1: mockEntrants[2],
        player2: mockEntrants[5],
        winner: 'p3',
        status: 'completed'
      },
      {
        _id: 'm4',
        round: 1,
        player1: mockEntrants[3],
        player2: mockEntrants[4],
        status: 'in_progress'
      },
      // Round 2 (Semifinals)
      {
        _id: 'm5',
        round: 2,
        player1: mockEntrants[0],
        player2: mockEntrants[2],
        status: 'pending'
      },
      {
        _id: 'm6',
        round: 2,
        player1: mockEntrants[1],
        player2: mockEntrants.find(p => p._id === 'm4-winner'), // Would be dynamic
        status: 'pending'
      },
      // Final
      {
        _id: 'm7',
        round: 3,
        status: 'pending'
      }
    ];

    setMatches(mockMatches);
    setLoading(false);
  };

  const getRounds = () => {
    const rounds: Match[][] = [];
    const maxRound = Math.max(...matches.map(m => m.round));

    for (let i = 1; i <= maxRound; i++) {
      rounds.push(matches.filter(m => m.round === i));
    }

    return rounds;
  };

  const getMatchStatusClass = (match: Match) => {
    switch (match.status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in-progress';
      case 'pending': return 'pending';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading tournament bracket...</div>;
  }

  const rounds = getRounds();

  return (
    <div className="tournament-bracket">
      <div className="bracket-header">
        <h2>{tournament.name} - Bracket</h2>
        <div className="bracket-info">
          <span className="status">Status: {tournament.status}</span>
          <span className="players">{tournament.currentPlayers}/{tournament.maxPlayers} players</span>
        </div>
      </div>

      <div className="bracket-container">
        {rounds.map((roundMatches, roundIndex) => (
          <div key={roundIndex} className="round">
            <h3 className="round-title">
              {roundIndex === rounds.length - 1 ? 'Final' :
               roundIndex === rounds.length - 2 ? 'Semifinals' :
               `Round ${roundIndex + 1}`}
            </h3>

            <div className="matches">
              {roundMatches.map(match => (
                <div
                  key={match._id}
                  className={`match ${getMatchStatusClass(match)}`}
                  onClick={() => onMatchClick?.(match._id)}
                >
                  <div className="match-players">
                    <div className={`player ${match.winner === match.player1?._id ? 'winner' : ''}`}>
                      <span className="player-name">
                        {match.player1?.name || 'TBD'}
                      </span>
                      {match.player1?.seed && (
                        <span className="player-seed">({match.player1.seed})</span>
                      )}
                    </div>

                    <div className="vs">vs</div>

                    <div className={`player ${match.winner === match.player2?._id ? 'winner' : ''}`}>
                      <span className="player-name">
                        {match.player2?.name || 'TBD'}
                      </span>
                      {match.player2?.seed && (
                        <span className="player-seed">({match.player2.seed})</span>
                      )}
                    </div>
                  </div>

                  {match.status === 'completed' && match.winner && (
                    <div className="match-result">
                      Winner: {match.player1?._id === match.winner ? match.player1.name : match.player2?.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bracket-legend">
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in-progress"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color pending"></div>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;