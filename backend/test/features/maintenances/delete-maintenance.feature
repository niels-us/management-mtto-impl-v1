Feature: Delete Maintenance - Remove a maintenance record by ID

    Scenario: Success - Existing maintenance is deleted
        Given Enter a delete maintenance payload delete-maintenance-payload success_payload
        And The maintenance repository has the maintenance record
        When Execute the deleteMaintenance action with JWT token
        Then The response should confirm deletion with message "Maintenance deleted successfully"

    Scenario: Unauthorized - Missing authentication header returns error
        Given Enter a delete maintenance payload delete-maintenance-payload success_payload
        When Execute the deleteMaintenance action without JWT token
        Then The response should be an authentication error with message "Unauthenticated user"

    Scenario: Invalid JWT token returns unauthorized error
        Given Enter a delete maintenance payload delete-maintenance-payload success_payload
        When Execute the deleteMaintenance action with invalid JWT token
        Then The response should be an authentication error with message "Invalid token"

    Scenario: Not found - Non-existent maintenance returns error
        Given Enter a delete maintenance payload delete-maintenance-payload not_found_payload
        And The maintenance repository returns no record
        When Execute the deleteMaintenance action with JWT token
        Then The response should be a not found error with message "Maintenance not found or access denied"

    Scenario: Bad request - Invalid UUID format returns error
        Given Enter a delete maintenance payload delete-maintenance-payload invalid_id_payload
        When Execute the deleteMaintenance action with JWT token
        Then The response should be a validation error with message "Maintenance ID is required"
