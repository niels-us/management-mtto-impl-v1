Feature: AI query

  Scenario: Empty state
    When the user opens the AI query page
    Then the message "Ask me anything about your fleet maintenance" is displayed

  Scenario: Asking a question
    Given the AI service answers "Replace the pump gasket."
    When the user opens the AI query page
    And the user asks "How do I fix the pump?"
    Then the user message "How do I fix the pump?" is displayed
    And the assistant answer "Replace the pump gasket." is displayed

  Scenario: Submitting with Enter
    Given the AI service answers "Enter answer"
    When the user opens the AI query page
    And the user types "Enter query" and presses Enter
    Then the assistant answer "Enter answer" is displayed

  Scenario: AI failure shows a fallback message
    Given the AI service is unavailable
    When the user opens the AI query page
    And the user asks "Is AI up?"
    Then the message "Failed to get response from AI" is displayed
