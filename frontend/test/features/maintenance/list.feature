Feature: Maintenance list

  Scenario: Loading state shows skeletons
    Given the maintenance list is loading
    When the user opens the maintenance page
    Then a loading skeleton is displayed

  Scenario: No maintenance records
    Given the maintenance list is empty
    When the user opens the maintenance page
    Then the message "No maintenance records found" is displayed

  Scenario: Records are listed with status badges
    Given the maintenance list contains 2 records
    When the user opens the maintenance page
    Then the record "Replace filter" is displayed
    And the record "Oil change" is displayed
    And a "Pending" status badge is shown
    And a "Completed" status badge is shown

  Scenario: Filtering by status
    Given the maintenance list contains 2 records
    When the user opens the maintenance page
    And the user selects the filter "Pending"
    Then the list is requested with status "pending"
