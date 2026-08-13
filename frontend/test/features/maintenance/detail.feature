Feature: Maintenance detail

  Scenario: Loading state shows skeletons
    Given the maintenance record is loading
    When the user opens the maintenance detail
    Then a loading skeleton is displayed

  Scenario: Missing record
    Given the maintenance list is empty
    When the user opens the maintenance detail
    Then the message "Maintenance record not found" is displayed

  Scenario: Record details are shown
    Given a maintenance record exists
    When the user opens the maintenance detail
    Then the description "Replace filter" is displayed
    And the component id "c1" is displayed
    And the created by user "u1" is displayed

  Scenario: Updating the status
    Given a maintenance record exists
    When the user opens the maintenance detail
    And the user sets the status to "completed"
    And the user submits the update
    Then the API is called with id "m1" and status "completed"

  Scenario: Deleting the record
    Given a maintenance record exists
    When the user opens the maintenance detail
    And the user deletes the record
    Then the API is called with id "m1"
    And the user is navigated to "/maintenance"
