import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShipCard from './ShipCard'
import { Ship } from '../../types/game'

// Mock available systems for testing
const mockAvailableSystems = ['Alpha Centauri', 'Sirius', 'Vega']

describe('ShipCard', () => {
  const mockShip: Ship = {
    _id: 'ship1',
    name: 'USS Enterprise',
    type: 'military',
    location: 'Alpha Centauri',
    orders: 'hold',
    fuel: 8,
    maxFuel: 10,
    br: 5,
    owner: 'Player1'
  }

  const mockOnOrderChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ship information correctly', () => {
    render(
      <ShipCard
        ship={mockShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('USS Enterprise')).toBeInTheDocument()
    expect(screen.getByText('military')).toBeInTheDocument()
    expect(screen.getByText('Alpha Centauri')).toBeInTheDocument()
    expect(screen.getByText('8/10')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('displays current order correctly', () => {
    render(
      <ShipCard
        ship={mockShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('Current Order:')).toBeInTheDocument()
    expect(screen.getByText('Hold Position')).toBeInTheDocument()
  })

  it('shows edit button and allows editing orders', async () => {
    const user = userEvent.setup()
    render(
      <ShipCard
        ship={mockShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    const editButton = screen.getByText('Change')
    await user.click(editButton)

    expect(screen.getByText('Order:')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hold Position')).toBeInTheDocument()
  })

  it('calls onOrderChange when saving new orders', async () => {
    const user = userEvent.setup()
    render(
      <ShipCard
        ship={mockShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    // Enter edit mode
    const editButton = screen.getByText('Change')
    await user.click(editButton)

    // Change order to move
    const orderSelect = screen.getByDisplayValue('Hold Position')
    await user.selectOptions(orderSelect, 'move')

    // Select target system
    const systemSelect = screen.getByDisplayValue('Select system...')
    await user.selectOptions(systemSelect, 'Sirius')

    // Save changes
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)

    expect(mockOnOrderChange).toHaveBeenCalledWith('ship1', 'move', 'Sirius')
  })

  it('cancels editing without saving changes', async () => {
    const user = userEvent.setup()
    render(
      <ShipCard
        ship={mockShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    // Enter edit mode
    const editButton = screen.getByText('Change')
    await user.click(editButton)

    // Change order
    const orderSelect = screen.getByDisplayValue('Hold Position')
    await user.selectOptions(orderSelect, 'move')

    // Cancel changes
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnOrderChange).not.toHaveBeenCalled()
    expect(screen.getByText('Hold Position')).toBeInTheDocument()
  })

  it('shows fuel bar with correct percentage', () => {
    render(
      <ShipCard
        ship={mockShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    const fuelBar = screen.getByText('8/10')
    expect(fuelBar).toBeInTheDocument()

    // Check that fuel bar fill has correct width (80%)
    const fuelFill = document.querySelector('.fuel-fill')
    expect(fuelFill).toHaveStyle({ width: '80%' })
  })

  it('displays different ship types correctly', () => {
    const civilianShip: Ship = {
      ...mockShip,
      type: 'civilian',
      name: 'Colony Ship Alpha'
    }

    render(
      <ShipCard
        ship={civilianShip}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('Colony Ship Alpha')).toBeInTheDocument()
    expect(screen.getByText('civilian')).toBeInTheDocument()
  })

  it('handles ships with order arguments', () => {
    const shipWithOrders: Ship = {
      ...mockShip,
      orders: 'move',
      orderArguments: 'Sirius'
    }

    render(
      <ShipCard
        ship={shipWithOrders}
        onOrderChange={mockOnOrderChange}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('Move to System → Sirius')).toBeInTheDocument()
  })

  it('renders without onOrderChange prop (read-only mode)', () => {
    render(
      <ShipCard
        ship={mockShip}
        availableSystems={mockAvailableSystems}
      />
    )

    expect(screen.getByText('USS Enterprise')).toBeInTheDocument()
    expect(screen.queryByText('Change')).not.toBeInTheDocument()
  })
})