import React, { useState } from 'react';
import { Tournament } from '../../types/game';
import './TournamentCreateForm.css';

interface TournamentCreateFormProps {
  onTournamentCreated: (tournament: Tournament) => void;
  onCancel: () => void;
}

const TournamentCreateForm: React.FC<TournamentCreateFormProps> = ({
  onTournamentCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    series: '',
    maxPlayers: 16,
    prizePool: 500,
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const seriesOptions = [
    'Championship Series',
    'Qualifier Series',
    'Classic Series',
    'Beginner Series',
    'Elite Series'
  ];

  const playerOptions = [8, 16, 24, 32];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxPlayers' || name === 'prizePool' ? parseInt(value) : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }

    if (!formData.series) {
      newErrors.series = 'Series selection is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.prizePool <= 0) {
      newErrors.prizePool = 'Prize pool must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create tournament object
    const newTournament: Tournament = {
      _id: `tournament_${Date.now()}`, // Temporary ID
      name: formData.name,
      series: formData.series,
      status: 'upcoming',
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      maxPlayers: formData.maxPlayers,
      currentPlayers: 0,
      prizePool: formData.prizePool,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onTournamentCreated(newTournament);
  };

  return (
    <div className="tournament-create-form">
      <div className="form-header">
        <h2>Create New Tournament</h2>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label htmlFor="name">Tournament Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter tournament name"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="series">Series *</label>
          <select
            id="series"
            name="series"
            value={formData.series}
            onChange={handleInputChange}
            className={errors.series ? 'error' : ''}
          >
            <option value="">Select a series</option>
            {seriesOptions.map(series => (
              <option key={series} value={series}>{series}</option>
            ))}
          </select>
          {errors.series && <span className="error-message">{errors.series}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="maxPlayers">Max Players</label>
            <select
              id="maxPlayers"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleInputChange}
            >
              {playerOptions.map(count => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="prizePool">Prize Pool ($)</label>
            <input
              type="number"
              id="prizePool"
              name="prizePool"
              value={formData.prizePool}
              onChange={handleInputChange}
              min="0"
              step="50"
              className={errors.prizePool ? 'error' : ''}
            />
            {errors.prizePool && <span className="error-message">{errors.prizePool}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={errors.startDate ? 'error' : ''}
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={errors.endDate ? 'error' : ''}
            />
            {errors.endDate && <span className="error-message">{errors.endDate}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Tournament
          </button>
        </div>
      </form>
    </div>
  );
};

export default TournamentCreateForm;