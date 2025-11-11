import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import TournamentList from './TournamentList'
import { Tournament } from '../../types/game'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TournamentList', () => {
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
  ]

  const mockOnTournamentSelect = vi.fn()
  const mockOnCreateTournament = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockTournaments)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders tournament list after loading', async () => {
    render(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Tournaments')).toBeInTheDocument()
    })

    expect(screen.getByText('Winter Championship 2025')).toBeInTheDocument()
    expect(screen.getByText('Spring Qualifier')).toBeInTheDocument()
    expect(screen.getByText('Autumn Classic 2024')).toBeInTheDocument()
  })

  it('displays tournament information correctly', async () => {
    render(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Winter Championship 2025')).toBeInTheDocument()
    })

    expect(screen.getByText('Championship Series')).toBeInTheDocument()
    expect(screen.getByText('12/16')).toBeInTheDocument()
    expect(screen.getByText('$1000')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('shows winner for completed tournaments', async () => {
    render(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Autumn Classic 2024')).toBeInTheDocument()
    })

    expect(screen.getByText('PlayerChampion')).toBeInTheDocument()
  })

  it('filters tournaments by status', async () => {
    const user = userEvent.setup()
    render(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Winter Championship 2025')).toBeInTheDocument()
    })

    // Filter to active only
    const filterSelect = screen.getByDisplayValue('All Tournaments')
    await user.selectOptions(filterSelect, 'active')

    expect(screen.getByText('Winter Championship 2025')).toBeInTheDocument()
    expect(screen.queryByText('Spring Qualifier')).not.toBeInTheDocument()
    expect(screen.queryByText('Autumn Classic 2024')).not.toBeInTheDocument()
  })

  it('shows create tournament button when callback provided', async () => {
    render(<TournamentList onCreateTournament={mockOnCreateTournament} />)

    await waitFor(() => {
      expect(screen.getByText('Tournaments')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Tournament')
    expect(createButton).toBeInTheDocument()
  })

  it('calls onCreateTournament when create button is clicked', async () => {
    const user = userEvent.setup()
    render(<TournamentList onCreateTournament={mockOnCreateTournament} />)

    await waitFor(() => {
      expect(screen.getByText('Tournaments')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Tournament')
    await user.click(createButton)

    expect(mockOnCreateTournament).toHaveBeenCalledTimes(1)
  })

  it('calls onTournamentSelect when tournament card is clicked', async () => {
    const user = userEvent.setup()
    render(<TournamentList onTournamentSelect={mockOnTournamentSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Winter Championship 2025')).toBeInTheDocument()
    })

    const tournamentCard = screen.getByText('Winter Championship 2025').closest('.tournament-card')
    await user.click(tournamentCard!)

    expect(mockOnTournamentSelect).toHaveBeenCalledWith('tournament1')
  })

  it('shows join button for upcoming tournaments', async () => {
    render(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Spring Qualifier')).toBeInTheDocument()
    })

    const joinButtons = screen.getAllByText('Join Tournament')
    expect(joinButtons.length).toBeGreaterThan(0)
  })

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<TournamentList />)

    await waitFor(() => {
      expect(screen.queryByText('Loading tournaments...')).not.toBeInTheDocument()
    })

    // Should still render the component structure even with error
    expect(screen.getByText('Tournaments')).toBeInTheDocument()
  })
})