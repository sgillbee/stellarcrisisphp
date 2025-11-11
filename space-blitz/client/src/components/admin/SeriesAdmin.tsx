import React, { useState, useEffect } from 'react';
import { Series, ShipTypeOption } from '../../types/game';
import './SeriesAdmin.css';

const SeriesAdmin: React.FC = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockSeries: Series[] = [
        {
          _id: 'series1',
          name: 'Championship Series',
          description: 'Elite tournament series for experienced players',
          gameType: 'standard',
          maxPlayers: 8,
          isActive: true,
          shipTypeOptions: [
            {
              type: 'military',
              name: 'Battleship',
              description: 'Heavy combat vessel',
              cost: 1000,
              br: 8,
              fuelCapacity: 20,
              maintenanceCost: 50
            },
            {
              type: 'civilian',
              name: 'Colony Ship',
              description: 'Planetary colonization vessel',
              cost: 800,
              br: 1,
              fuelCapacity: 15,
              maintenanceCost: 30
            }
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2025-01-01')
        },
        {
          _id: 'series2',
          name: 'Beginner Series',
          description: 'Entry-level tournaments for new players',
          gameType: 'tutorial',
          maxPlayers: 4,
          isActive: true,
          shipTypeOptions: [
            {
              type: 'military',
              name: 'Frigate',
              description: 'Light combat vessel',
              cost: 500,
              br: 3,
              fuelCapacity: 10,
              maintenanceCost: 20
            }
          ],
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-12-01')
        }
      ];

      setSeries(mockSeries);
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeries = (newSeries: Series) => {
    setSeries(prev => [...prev, newSeries]);
    setShowCreateForm(false);
  };

  const handleUpdateSeries = (updatedSeries: Series) => {
    setSeries(prev => prev.map(s => s._id === updatedSeries._id ? updatedSeries : s));
    setEditingSeries(null);
  };

  const handleDeleteSeries = (seriesId: string) => {
    if (window.confirm('Are you sure you want to delete this series? This action cannot be undone.')) {
      setSeries(prev => prev.filter(s => s._id !== seriesId));
    }
  };

  const toggleSeriesStatus = (seriesId: string) => {
    setSeries(prev => prev.map(s =>
      s._id === seriesId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  if (loading) {
    return <div className="loading">Loading series...</div>;
  }

  return (
    <div className="series-admin">
      <div className="admin-header">
        <h2>Series Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Series
        </button>
      </div>

      {showCreateForm && (
        <SeriesForm
          onSave={handleCreateSeries}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingSeries && (
        <SeriesForm
          series={editingSeries}
          onSave={handleUpdateSeries}
          onCancel={() => setEditingSeries(null)}
        />
      )}

      <div className="series-list">
        {series.length === 0 ? (
          <div className="no-series">
            <p>No series found. Create your first series to get started.</p>
          </div>
        ) : (
          series.map(seriesItem => (
            <div key={seriesItem._id} className="series-card">
              <div className="series-header">
                <div className="series-info">
                  <h3>{seriesItem.name}</h3>
                  <span className={`status ${seriesItem.isActive ? 'active' : 'inactive'}`}>
                    {seriesItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="series-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => toggleSeriesStatus(seriesItem._id)}
                  >
                    {seriesItem.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setEditingSeries(seriesItem)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteSeries(seriesItem._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="series-details">
                <p className="description">{seriesItem.description}</p>
                <div className="series-meta">
                  <span>Game Type: {seriesItem.gameType}</span>
                  <span>Max Players: {seriesItem.maxPlayers}</span>
                  <span>Ship Types: {seriesItem.shipTypeOptions.length}</span>
                </div>
              </div>

              <div className="ship-types">
                <h4>Ship Types:</h4>
                <div className="ship-type-list">
                  {seriesItem.shipTypeOptions.map((shipType, index) => (
                    <div key={index} className="ship-type-item">
                      <div className="ship-type-header">
                        <span className="ship-name">{shipType.name}</span>
                        <span className="ship-type">{shipType.type}</span>
                      </div>
                      <div className="ship-stats">
                        <span>BR: {shipType.br}</span>
                        <span>Cost: ${shipType.cost}</span>
                        <span>Fuel: {shipType.fuelCapacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface SeriesFormProps {
  series?: Series;
  onSave: (series: Series) => void;
  onCancel: () => void;
}

const SeriesForm: React.FC<SeriesFormProps> = ({ series, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: series?.name || '',
    description: series?.description || '',
    gameType: series?.gameType || 'standard',
    maxPlayers: series?.maxPlayers || 4,
    isActive: series?.isActive ?? true,
    shipTypeOptions: series?.shipTypeOptions || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSeries: Series = {
      _id: series?._id || `series_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      gameType: formData.gameType,
      maxPlayers: formData.maxPlayers,
      isActive: formData.isActive,
      shipTypeOptions: formData.shipTypeOptions,
      createdAt: series?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSave(newSeries);
  };

  return (
    <div className="series-form">
      <h3>{series ? 'Edit Series' : 'Create New Series'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Game Type</label>
            <select
              value={formData.gameType}
              onChange={(e) => setFormData(prev => ({ ...prev, gameType: e.target.value }))}
            >
              <option value="standard">Standard</option>
              <option value="tutorial">Tutorial</option>
              <option value="blitz">Blitz</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Max Players</label>
            <input
              type="number"
              value={formData.maxPlayers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
              min="2"
              max="16"
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.isActive.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {series ? 'Update Series' : 'Create Series'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SeriesAdmin;