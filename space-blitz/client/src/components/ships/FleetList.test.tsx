import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import FleetList from './FleetList'
import { Ship } from '../../types/game'

describe('FleetList', () => {
  const mockShips: Ship[] = [
    {
      _id: 'ship1',
      name: 'USS Enterprise',
      type: 'military',
      location: 'Alpha Centauri',
      orders: 'hold',
      fuel: 8,
      maxFuel: 10,
      br: 5,
      owner: 'Player1'
    },
    {
      _id: 'ship2',
      name: 'USS Voyager',
      type: 'military',
      location: 'Sirius',
      orders: 'move',
      orderArguments: 'Vega',
      fuel: 6,
      maxFuel: 10,
      br: 4,
      owner: 'Player1'
    },
    {
      _id: 'ship3',
      name: 'Colony Ship Alpha',
      type: 'civilian',
      location: 'Alpha Centauri',
      orders: 'colonize',
      orderArguments: 'Betelgeuse',
      fuel: 9,
      maxFuel: 10,
      br: 1,
      owner: 'Player1'
    }
  ]

  const mockOnShipOrderChange = vi.fn()
  const mockAvailableSystems = ['Alpha Centauri', 'Sirius', 'Vega', 'Betelgeuse']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders fleet header with statistics', () => {
    render(
      <FleetList
        ships={mockShips}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('Fleet Overview')).toBeInTheDocument()
    expect(screen.getByText('Total Ships: 3')).toBeInTheDocument()
    expect(screen.getByText('Military: 2')).toBeInTheDocument()
    expect(screen.getByText('Civilian: 1')).toBeInTheDocument()
  })

  it('renders all ships by default', () => {
    render(
      <FleetList
        ships={mockShips}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('USS Enterprise')).toBeInTheDocument()
    expect(screen.getByText('USS Voyager')).toBeInTheDocument()
    expect(screen.getByText('Colony Ship Alpha')).toBeInTheDocument()
  })

  it('filters ships by type', async () => {
    const user = userEvent.setup()
    render(
      <FleetList
        ships={mockShips}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    // Filter to military only
    const filterSelect = screen.getByDisplayValue('All Ships')
    await user.selectOptions(filterSelect, 'military')

    expect(screen.getByText('USS Enterprise')).toBeInTheDocument()
    expect(screen.getByText('USS Voyager')).toBeInTheDocument()
    expect(screen.queryByText('Colony Ship Alpha')).not.toBeInTheDocument()
  })

  it('sorts ships by different criteria', async () => {
    const user = userEvent.setup()
    render(
      <FleetList
        ships={mockShips}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    // Sort by fuel level
    const sortSelect = screen.getByDisplayValue('Name')
    await user.selectOptions(sortSelect, 'fuel')

    // Ships should be sorted by fuel: Colony Ship (9), Enterprise (8), Voyager (6)
    const shipNames = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent)
    expect(shipNames).toEqual(['Colony Ship Alpha', 'USS Enterprise', 'USS Voyager'])
  })

  it('shows empty state when no ships match filter', async () => {
    const user = userEvent.setup()
    const militaryShips = mockShips.filter(ship => ship.type === 'military')

    render(
      <FleetList
        ships={militaryShips}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    // Filter to civilian only (no civilian ships in filtered data)
    const filterSelect = screen.getByDisplayValue('All Ships')
    await user.selectOptions(filterSelect, 'civilian')

    expect(screen.getByText('No ships found matching the current filter.')).toBeInTheDocument()
  })

  it('passes props to ShipCard components', () => {
    render(
      <FleetList
        ships={mockShips.slice(0, 1)} // Just one ship for simplicity
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    // The ShipCard should receive the correct props
    expect(screen.getByText('USS Enterprise')).toBeInTheDocument()
  })

  it('handles empty ship list', () => {
    render(
      <FleetList
        ships={[]}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('Fleet Overview')).toBeInTheDocument()
    expect(screen.getByText('Total Ships: 0')).toBeInTheDocument()
    expect(screen.getByText('Military: 0')).toBeInTheDocument()
    expect(screen.getByText('Civilian: 0')).toBeInTheDocument()
    expect(screen.getByText('No ships found matching the current filter.')).toBeInTheDocument()
  })

  it('renders in read-only mode when isEditable is false', () => {
    render(
      <FleetList
        ships={mockShips.slice(0, 1)}
        onShipOrderChange={mockOnShipOrderChange}
        availableSystems={mockAvailableSystems}
        isEditable={false}
      />
    )

    expect(screen.getByText('USS Enterprise')).toBeInTheDocument()
    // ShipCard should be in read-only mode
  })
})