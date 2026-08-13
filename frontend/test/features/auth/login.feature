Feature: Login - user authentication

  Scenario: Successful login redirects to the dashboard
    Given the user is on the login page
    And the authentication API accepts the credentials
    When the user submits the sign-in form
    Then the user is redirected to the dashboard

  Scenario: Failed login shows the API error
    Given the user is on the login page
    And the authentication API rejects with message "Bad credentials"
    When the user submits the sign-in form
    Then the error message "Bad credentials" is shown

  Scenario: Failed login without message shows a fallback
    Given the user is on the login page
    And the authentication API fails without a message
    When the user submits the sign-in form
    Then the error message "Invalid credentials" is shown
