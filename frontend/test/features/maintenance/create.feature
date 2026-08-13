Feature: Create maintenance

  Scenario: The form is rendered
    When the user opens the create maintenance page
    Then the description and scheduled date fields are displayed

  Scenario: Invalid input is rejected
    Given the user is on the create maintenance page
    When the user enters a short description
    And the user submits the form
    Then the API is not called

  Scenario: Valid input creates maintenance
    Given the user is on the create maintenance page
    And the user is authenticated
    When the user enters a description and scheduled date
    And the user submits the form
    Then the API is called with the maintenance payload
    And the user is navigated to "/maintenance"
