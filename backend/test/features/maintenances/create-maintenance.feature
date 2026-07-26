Feature: Create Maintenance - Register new maintenance record for a component

    Scenario Outline: Executing create maintenance service with valid authentication
        Given Enter a maintenance payload <input> <dataObject>
        And Wait for component repository response <componentStatus> <mockData> <mockObject>
        When Execute the createMaintenance action with JWT token
        Then The response will be displayed as maintenance <result> <dataObject>

        Examples:
            | input                       | componentStatus | dataObject       | mockData         | mockObject       | result                |
            | create-maintenance-payload  | ok              | success_payload  | maintenance-mock | success_payload  | maintenance-response  |

    Scenario: Unauthorized - Missing authentication header returns error
        Given Enter a maintenance payload create-maintenance-payload no_auth
        When Execute the createMaintenance action without JWT token
        Then The response should be an authentication error with message "Unauthenticated user"

    Scenario Outline: Invalid JWT token returns unauthorized error
        Given Enter a maintenance payload <input> <dataObject>
        When Execute the createMaintenance action with invalid JWT token
        Then The response should be an authentication error with message "Invalid token"

        Examples:
            | input                       | dataObject       |
            | create-maintenance-payload  | success_payload  |

    Scenario Outline: Bad request - Missing required fields returns validation error
        Given Enter a maintenance payload <input> <dataObject>
        When Execute the createMaintenance action with JWT token
        Then The response should be a validation error with message <errorMessage>

        Examples:
            | input                       | dataObject              | errorMessage                                                      |
            | create-maintenance-payload  | missing_description     | description, scheduledAt, customerId and createdBy are required   |
            | create-maintenance-payload  | missing_scheduled_at    | description, scheduledAt, customerId and createdBy are required   |
            | create-maintenance-payload  | missing_created_by      | description, scheduledAt, customerId and createdBy are required   |

    Scenario: Access denied - Wrong customer returns error
        Given Enter a maintenance payload create-maintenance-payload wrong_customer
        When Execute the createMaintenance action with JWT token
        Then The response should be an access denied error with message "Field 'customerId' must be a valid UUID v4. Received: different-cust"

    Scenario: Component not found - Non-existent component returns error
        Given Enter a maintenance payload create-maintenance-payload component_not_found
        And Component does not exist in repository
        When Execute the createMaintenance action with JWT token
        Then The response should be a component error with message "Field 'componentId' must be a valid UUID v4. Received: non-existent-component"
