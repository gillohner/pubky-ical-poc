import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Example component test
describe('Example Component Tests', () => {
  it('renders a simple component', () => {
    const TestComponent = () => <div>Hello Test</div>
    render(<TestComponent />)
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    const Button = () => (
      <button onClick={handleClick}>Click me</button>
    )
    
    render(<Button />)
    await user.click(screen.getByRole('button', { name: /click me/i }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
