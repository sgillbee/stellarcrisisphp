import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import TournamentCreateForm from './TournamentCreateForm'
import { Tournament } from '../../types/game'

describe('TournamentCreateForm', () => {
  const mockOnTournamentCreated = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with all required fields', () => {
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Create New Tournament')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tournament Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Series/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Max Players/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prize Pool/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument()
    expect(screen.getByLabelText(/End Date/)).toBeInTheDocument()
    expect(screen.getByText('Create Tournament')).toBeInTheDocument()
    expect(screen.getAllByText('Cancel')).toHaveLength(2)
  })

  it('renders series options correctly', () => {
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const seriesSelect = screen.getByLabelText(/Series/)
    expect(seriesSelect).toHaveValue('')

    const options = screen.getAllByRole('option', { hidden: true })
    const seriesOptions = options.filter(option =>
      ['Championship Series', 'Qualifier Series', 'Classic Series', 'Beginner Series', 'Elite Series'].includes(option.textContent || '')
    )
    expect(seriesOptions).toHaveLength(5)
  })

  it('renders max players options correctly', () => {
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const maxPlayersSelect = screen.getByLabelText(/Max Players/)
    expect(maxPlayersSelect).toHaveValue('16') // Default value

    const options = screen.getAllByRole('option', { hidden: true })
    const playerOptions = options.filter(option =>
      ['8', '16', '24', '32'].includes(option.textContent || '')
    )
    expect(playerOptions).toHaveLength(4)
  })

  it('updates form data when inputs change', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText(/Tournament Name/)
    const seriesSelect = screen.getByLabelText(/Series/)
    const prizePoolInput = screen.getByLabelText(/Prize Pool/)
    const startDateInput = screen.getByLabelText(/Start Date/)
    const endDateInput = screen.getByLabelText(/End Date/)

    await user.type(nameInput, 'Test Tournament')
    await user.selectOptions(seriesSelect, 'Championship Series')
    await user.clear(prizePoolInput)
    await user.type(prizePoolInput, '1000')
    await user.type(startDateInput, '2024-06-01')
    await user.type(endDateInput, '2024-06-30')

    expect(nameInput).toHaveValue('Test Tournament')
    expect(seriesSelect).toHaveValue('Championship Series')
    expect(prizePoolInput).toHaveValue(1000)
    expect(startDateInput).toHaveValue('2024-06-01')
    expect(endDateInput).toHaveValue('2024-06-30')
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByText('Create Tournament')
    await user.click(submitButton)

    expect(screen.getByText('Tournament name is required')).toBeInTheDocument()
    expect(screen.getByText('Series selection is required')).toBeInTheDocument()
    expect(screen.getByText('Start date is required')).toBeInTheDocument()
    expect(screen.getByText('End date is required')).toBeInTheDocument()
  })

  it('shows validation error for invalid date range', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText(/Tournament Name/)
    const seriesSelect = screen.getByLabelText(/Series/)
    const startDateInput = screen.getByLabelText(/Start Date/)
    const endDateInput = screen.getByLabelText(/End Date/)
    const submitButton = screen.getByText('Create Tournament')

    await user.type(nameInput, 'Test Tournament')
    await user.selectOptions(seriesSelect, 'Championship Series')
    await user.type(startDateInput, '2024-06-30')
    await user.type(endDateInput, '2024-06-01') // End date before start date
    await user.click(submitButton)

    expect(screen.getByText('End date must be after start date')).toBeInTheDocument()
  })

  it('shows validation error for invalid prize pool', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText(/Tournament Name/)
    const seriesSelect = screen.getByLabelText(/Series/)
    const prizePoolInput = screen.getByLabelText(/Prize Pool/)
    const startDateInput = screen.getByLabelText(/Start Date/)
    const endDateInput = screen.getByLabelText(/End Date/)
    const submitButton = screen.getByText('Create Tournament')

    await user.type(nameInput, 'Test Tournament')
    await user.selectOptions(seriesSelect, 'Championship Series')
    await user.clear(prizePoolInput)
    await user.type(prizePoolInput, '0') // Invalid prize pool
    await user.type(startDateInput, '2024-06-01')
    await user.type(endDateInput, '2024-06-30')
    await user.click(submitButton)

    expect(screen.getByText('Prize pool must be greater than 0')).toBeInTheDocument()
  })

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByText('Create Tournament')
    await user.click(submitButton)

    expect(screen.getByText('Tournament name is required')).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/Tournament Name/)
    await user.type(nameInput, 'T')

    expect(screen.queryByText('Tournament name is required')).not.toBeInTheDocument()
  })

  it('calls onTournamentCreated with correct data when form is valid', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText(/Tournament Name/)
    const seriesSelect = screen.getByLabelText(/Series/)
    const maxPlayersSelect = screen.getByLabelText(/Max Players/)
    const prizePoolInput = screen.getByLabelText(/Prize Pool/)
    const startDateInput = screen.getByLabelText(/Start Date/)
    const endDateInput = screen.getByLabelText(/End Date/)
    const submitButton = screen.getByText('Create Tournament')

    await user.type(nameInput, 'Test Tournament')
    await user.selectOptions(seriesSelect, 'Championship Series')
    await user.selectOptions(maxPlayersSelect, '24')
    await user.clear(prizePoolInput)
    await user.type(prizePoolInput, '1500')
    await user.type(startDateInput, '2024-06-01')
    await user.type(endDateInput, '2024-06-30')
    await user.click(submitButton)

    expect(mockOnTournamentCreated).toHaveBeenCalledTimes(1)
    const createdTournament = mockOnTournamentCreated.mock.calls[0][0]

    expect(createdTournament.name).toBe('Test Tournament')
    expect(createdTournament.series).toBe('Championship Series')
    expect(createdTournament.maxPlayers).toBe(24)
    expect(createdTournament.prizePool).toBe(1500)
    expect(createdTournament.status).toBe('upcoming')
    expect(createdTournament.currentPlayers).toBe(0)
    expect(createdTournament.startDate).toEqual(new Date('2024-06-01'))
    expect(createdTournament.endDate).toEqual(new Date('2024-06-30'))
    expect(createdTournament._id).toMatch(/^tournament_\d+$/)
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const cancelButtons = screen.getAllByText('Cancel')
    const formCancelButton = cancelButtons[1] // The one in form actions
    await user.click(formCancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('prevents form submission when validation fails', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByText('Create Tournament')
    await user.click(submitButton)

    expect(mockOnTournamentCreated).not.toHaveBeenCalled()
  })

  it('handles numeric input conversion correctly', async () => {
    const user = userEvent.setup()
    render(
      <TournamentCreateForm
        onTournamentCreated={mockOnTournamentCreated}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText(/Tournament Name/)
    const seriesSelect = screen.getByLabelText(/Series/)
    const prizePoolInput = screen.getByLabelText(/Prize Pool/)
    const startDateInput = screen.getByLabelText(/Start Date/)
    const endDateInput = screen.getByLabelText(/End Date/)
    const submitButton = screen.getByText('Create Tournament')

    await user.type(nameInput, 'Test Tournament')
    await user.selectOptions(seriesSelect, 'Championship Series')
    await user.clear(prizePoolInput)
    await user.type(prizePoolInput, '750')
    await user.type(startDateInput, '2024-06-01')
    await user.type(endDateInput, '2024-06-30')
    await user.click(submitButton)

    const createdTournament = mockOnTournamentCreated.mock.calls[0][0]
    expect(typeof createdTournament.prizePool).toBe('number')
    expect(createdTournament.prizePool).toBe(750)
  })
})