import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaintenanceStatusBadge } from './StatusBadge';

describe('MaintenanceStatusBadge', () => {
  it.each([
    ['pending', 'Pending'],
    ['in_progress', 'In Progress'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ])('renders the label for status %s', (status, label) => {
    render(<MaintenanceStatusBadge status={status as never} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
