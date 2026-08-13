Feature: Vessel list

  Scenario: Loading state shows skeletons
    Given the vessel list is loading
    When the user opens the vessels page
    Then a loading skeleton is displayed

  Scenario: No registered vessels
    Given the vessel list is empty
    When the user opens the vessels page
    Then the message "No vessels found" is displayed

  Scenario: Registered vessels are listed
    Given the vessel list contains 2 vessels
    When the user opens the vessels page
    Then the vessel "Titan" is displayed
    And the vessel "Orion" is displayed
    And each vessel shows a "View Components" button
