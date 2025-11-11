import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Space Blitz')
  })

  it('renders the description', () => {
    render(<App />)
    expect(screen.getByText('A modern web-based strategy game')).toBeInTheDocument()
  })

  it('renders the button with initial count of 0', () => {
    render(<App />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('count is 0')
  })

  it('increments count when button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('count is 0')

    await act(async () => {
      await user.click(button)
    })
    expect(button).toHaveTextContent('count is 1')

    await act(async () => {
      await user.click(button)
    })
    expect(button).toHaveTextContent('count is 2')
  })


})