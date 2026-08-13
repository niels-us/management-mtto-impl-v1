Feature: Vessel components

  Scenario: Loading state shows skeletons
    Given the component list is loading
    When the user opens the components page for vessel v1
    Then a loading skeleton is displayed

  Scenario: No registered components
    Given the component list is empty
    When the user opens the components page for vessel v1
    Then the message "No components registered for this vessel" is displayed

  Scenario: Registered components are listed
    Given the vessel has 2 components
    When the user opens the components page for vessel v1
    Then the component "Main Engine" is displayed
    And the component "Aux Boiler" is displayed
    And each component shows a "Create Maintenance" button
