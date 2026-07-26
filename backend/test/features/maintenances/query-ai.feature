Feature: AI Query endpoint - POST /V1/maintenance/query-ai
  As an authenticated user
  I want to ask questions in natural language about my fleet maintenances
  So that the AI returns relevant answers based on my data

  Background:
    Given The JWT secret is configured

  Scenario: Successful AI query in Italian language
    Given The repositories return vessels, components and maintenances for the customer
    And The LLM provider is configured and available
    When The user sends the question "Elenca le mie imbarcazioni" with a valid JWT token
    Then The AI response is successful with an answer

  Scenario: Successful AI query in English language
    Given The repositories return vessels, components and maintenances for the customer
    And The LLM provider is configured and available
    When The user sends the question "List all my pending maintenances" with a valid JWT token
    Then The AI response is successful with an answer

  Scenario: AI query when customer has no vessels
    Given The repositories return no vessels for the customer
    And The LLM provider is configured and available
    When The user sends the question "List all vessels" with a valid JWT token
    Then The AI response is successful with an answer

  Scenario: AI query when LLM provider is not configured
    Given The repositories return vessels, components and maintenances for the customer
    And The LLM provider is NOT configured
    When The user sends the question "Show maintenance history" with a valid JWT token
    Then The AI response returns success false with an error message

  Scenario: AI query when LLM provider throws an error
    Given The repositories return vessels, components and maintenances for the customer
    And The LLM provider is configured but throws an error
    When The user sends the question "What are my maintenances?" with a valid JWT token
    Then The AI response returns success false with an error message

  Scenario: AI query fails when user is not authenticated
    Given No authentication header is present
    When The user sends the question "List vessels" without a JWT token
    Then The response should be an authentication error AUTH001

  Scenario: AI query fails with an invalid JWT token
    Given An invalid JWT token is provided
    When The user sends the question "List vessels" with an invalid JWT token
    Then The response should be an authentication error AUTH001

  Scenario: AI query fails when question is missing in payload
    Given The LLM provider is configured and available
    When The user sends a request with no question in the payload with a valid JWT token
    Then The response should be a validation error with status 400

  Scenario: AI query fails when question is too short
    Given The LLM provider is configured and available
    When The user sends the question "Hi" with a valid JWT token
    Then The response should be a validation error with status 400

  Scenario: AI query fails when question is too long
    Given The LLM provider is configured and available
    When The user sends a question exceeding 500 characters with a valid JWT token
    Then The response should be a validation error with status 400

  Scenario: Health check returns AI service status when authenticated
    Given The LLM provider is configured and available
    When The user calls the health check endpoint with a valid JWT token
    Then The health check response contains AI service availability

  Scenario: Health check fails when user is not authenticated
    Given No authentication header is present
    When The user calls the health check endpoint without a JWT token
    Then The response should be an authentication error AUTH001
