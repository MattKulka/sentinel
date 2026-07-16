import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';
import { renderWithUser } from '../test/utils';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('defaults to light and toggles to dark and back', async () => {
    const { user } = renderWithUser(<ThemeToggle />);
    const button = screen.getByRole('button', {
      name: /switch to dark theme/i,
    });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(
      screen.getByRole('button', { name: /switch to light theme/i }),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('persists the chosen theme', async () => {
    const { user } = renderWithUser(<ThemeToggle />);
    await user.click(
      screen.getByRole('button', { name: /switch to dark theme/i }),
    );
    expect(localStorage.getItem('sentinel-theme')).toBe('dark');
  });
});
