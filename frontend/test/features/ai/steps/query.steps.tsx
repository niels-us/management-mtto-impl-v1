import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import { getFeatureFile, getMockData } from '../../util/TestHelper';
import AIQueryPage from '@pages/ai/AIQueryPage';
import type { AIQueryResponse } from '@features/ai/model';

const aiMock = vi.hoisted(() => vi.fn());

vi.mock('@features/ai/hooks', () => ({
  useQueryAI: () => ({ mutateAsync: aiMock, isPending: false }),
}));

const aiResponse = getMockData<AIQueryResponse>(import.meta.url, 'ai-mock');
const feature = loadFeature(getFeatureFile(import.meta.url, 'query'));

function withAnswer(answer: string): AIQueryResponse {
  return { ...aiResponse, answer };
}

defineFeature(feature, (test) => {
  beforeEach(() => {
    aiMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test('Empty state', ({ when, then }) => {
    when('the user opens the AI query page', () => {
      render(<AIQueryPage />);
    });

    then('the message "Ask me anything about your fleet maintenance" is displayed', () => {
      expect(
        screen.getByText('Ask me anything about your fleet maintenance')
      ).toBeInTheDocument();
    });
  });

  test('Asking a question', ({ given, when, and, then }) => {
    given(/^the AI service answers "(.+)"$/, (answer: string) => {
      aiMock.mockResolvedValueOnce(withAnswer(answer));
    });

    when('the user opens the AI query page', () => {
      render(<AIQueryPage />);
    });

    and('the user asks "How do I fix the pump?"', async () => {
      await userEvent.type(
        screen.getByPlaceholderText('Type your question...'),
        'How do I fix the pump?'
      );
      await userEvent.click(screen.getByRole('button', { name: '' }));
    });

    then('the user message "How do I fix the pump?" is displayed', async () => {
      expect(await screen.findByText('How do I fix the pump?')).toBeInTheDocument();
    });

    and('the assistant answer "Replace the pump gasket." is displayed', async () => {
      expect(await screen.findByText('Replace the pump gasket.')).toBeInTheDocument();
    });
  });

  test('Submitting with Enter', ({ given, when, and, then }) => {
    given('the AI service answers "Enter answer"', () => {
      aiMock.mockResolvedValueOnce(withAnswer('Enter answer'));
    });

    when('the user opens the AI query page', () => {
      render(<AIQueryPage />);
    });

    and('the user types "Enter query" and presses Enter', async () => {
      await userEvent.type(
        screen.getByPlaceholderText('Type your question...'),
        'Enter query{enter}'
      );
    });

    then('the assistant answer "Enter answer" is displayed', async () => {
      expect(await screen.findByText('Enter answer')).toBeInTheDocument();
    });
  });

  test('AI failure shows a fallback message', ({ given, when, and, then }) => {
    given('the AI service is unavailable', () => {
      aiMock.mockRejectedValueOnce(new Error('AI down'));
    });

    when('the user opens the AI query page', () => {
      render(<AIQueryPage />);
    });

    and('the user asks "Is AI up?"', async () => {
      await userEvent.type(
        screen.getByPlaceholderText('Type your question...'),
        'Is AI up?'
      );
      await userEvent.click(screen.getByRole('button', { name: '' }));
    });

    then('the message "Failed to get response from AI" is displayed', async () => {
      expect(
        await screen.findByText('Failed to get response from AI')
      ).toBeInTheDocument();
    });
  });
});
