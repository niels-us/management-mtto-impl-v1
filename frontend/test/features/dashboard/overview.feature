Feature: Dashboard overview

  Scenario: Loading state shows skeletons
    Given the dashboard data is loading
    When the user opens the dashboard
    Then the stat cards are displayed

  Scenario: Stats and recent maintenance are shown
    Given the fleet has 2 vessels
    And there are 3 maintenance records
    When the user opens the dashboard
    Then the stat "Total Vessels" shows the value 2
    And the recent maintenance description "Replace filter" is displayed

  Scenario: Empty maintenance state
    Given the fleet has no maintenance
    When the user opens the dashboard
    Then the message "No maintenance records" is displayed
