import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the simulator UI with key panels', () => {
    const { container } = render(<App />)
    // The app shell should render with the correct class
    expect(container.querySelector('.app')).toBeInTheDocument()
    // The main content area should exist
    expect(container.querySelector('.app-main')).toBeInTheDocument()
    // The toolbar header should exist
    expect(container.querySelector('.app-toolbar')).toBeInTheDocument()
    // Grid panel should exist
    expect(container.querySelector('.app-grid-panel')).toBeInTheDocument()
    // Right panel with control board and inventory should exist
    expect(container.querySelector('.app-right-panel')).toBeInTheDocument()
    // Challenges section should exist
    expect(container.querySelector('.app-challenges')).toBeInTheDocument()
  })
})
