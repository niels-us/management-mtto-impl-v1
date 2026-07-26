Feature: Get Maintenance - Retrieve all maintenance records for authenticated user

    Scenario Outline: Executing get maintenance service with valid authentication
        Given Enter a get maintenance payload <input> <dataObject>
        And Wait for maintenance repository response <status> <mockData> <mockObject>
        When Execute the getMaintenance action with JWT token
        Then The response will be displayed <result> <dataObject>

        Examples:
            | input                  | status | dataObject      | mockData          | mockObject      | result               |
            | get-maintenance-payload| ok     | success_payload | maintenance-mock  | success_payload | maintenance-response |
            | get-maintenance-payload| ok     | empty_list      | maintenance-mock  | empty_list      | maintenance-response |

    Scenario: Unauthorized - Missing authentication header returns 401
        Given Enter a get maintenance payload get-maintenance-payload no_auth
        When Execute the getMaintenance action without JWT token
        Then The response should be an authentication error with message "Unauthenticated user"

    Scenario Outline: Invalid JWT token returns unauthorized error
        Given Enter a get maintenance payload <input> <dataObject>
        When Execute the getMaintenance action with invalid JWT token
        Then The response should be an authentication error with message "Invalid token"

        Examples:
            | input                  | dataObject      |
            | get-maintenance-payload| success_payload |

    Scenario: Successfully get maintenance records with multiple items
        Given Enter a get maintenance payload get-maintenance-payload multiple_items
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        When Execute the getMaintenance action with JWT token
        Then The response should contain maintenance records list multiple_items

    Scenario: Get maintenance with different customer ID should fail with unauthorized token
        Given Enter a get maintenance payload get-maintenance-payload different_customer
        When Execute the getMaintenance action with different customer JWT token
        Then The response should be an array response

    Scenario: Filter maintenance by pending status
        Given Enter a get maintenance payload get-maintenance-payload pending_status
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        And Set query parameter status pending
        When Execute the getMaintenance action with JWT token
        Then The response should contain only pending status maintenance
        And The response should not contain in_progress or completed maintenance

    Scenario: Filter maintenance by in_progress status
        Given Enter a get maintenance payload get-maintenance-payload in_progress_status
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        And Set query parameter status in_progress
        When Execute the getMaintenance action with JWT token
        Then The response should contain only in_progress status maintenance

    Scenario: Filter maintenance by completed status
        Given Enter a get maintenance payload get-maintenance-payload completed_status
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        And Set query parameter status completed
        When Execute the getMaintenance action with JWT token
        Then The response should contain only completed status maintenance

    Scenario: Filter maintenance by cancelled status returns empty when no records
        Given Enter a get maintenance payload get-maintenance-payload cancelled_status
        And Wait for maintenance repository response ok maintenance-mock empty_list
        And Set query parameter status cancelled
        When Execute the getMaintenance action with JWT token
        Then The response should be an empty array

    Scenario: Uppercase status parameter returns matching results
        Given Enter a get maintenance payload get-maintenance-payload pending_status
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        And Set query parameter status PENDING
        When Execute the getMaintenance action with JWT token
        Then The response should contain only pending status maintenance

    Scenario: Case-insensitive status filtering works correctly
        Given Enter a get maintenance payload get-maintenance-payload mixed_case_status
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        And Set query parameter status PeNdInG
        When Execute the getMaintenance action with JWT token
        Then The response should contain only pending status maintenance

    Scenario: Empty status parameter returns all maintenance records
        Given Enter a get maintenance payload get-maintenance-payload all_status
        And Wait for maintenance repository response ok maintenance-mock multiple_items
        And Set query parameter status empty
        When Execute the getMaintenance action with JWT token
        Then The response should contain all maintenance records with multiple statuses

    Scenario: Valid status filter with single maintenance result
        Given Enter a get maintenance payload get-maintenance-payload pending_with_single
        And Wait for maintenance repository response ok maintenance-mock single_pending_item
        And Set query parameter status pending
        When Execute the getMaintenance action with JWT token
        Then The response should contain exactly 1 maintenance record
        And The maintenance record should have status pending
