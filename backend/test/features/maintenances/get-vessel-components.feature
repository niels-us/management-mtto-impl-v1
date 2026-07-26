Feature: Get Vessel Components - Retrieve all components for a specific vessel

    Scenario Outline: Executing get vessel components service with valid authentication
        Given Enter a get vessel components payload <input> <dataObject>
        And Set vessel path parameter <vesselId>
        And Wait for component repository response <status> <mockData> <mockObject>
        When Execute the getVesselComponents action with JWT token
        Then The response will display components <result> <dataObject>

        Examples:
            | input                          | vesselId                             | status | dataObject         | mockData         | mockObject         | result               |
            | get-vessel-components-payload  | e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b | ok     | success_payload    | components-mock  | success_payload    | components-response  |
            | get-vessel-components-payload  | e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b | ok     | empty_components   | components-mock  | empty_components   | components-response  |

    Scenario: Unauthorized - Missing authentication header returns 401
        Given Enter a get vessel components payload get-vessel-components-payload no_auth
        And Set vessel path parameter e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b
        When Execute the getVesselComponents action without JWT token
        Then The response should be an authentication error with message "Unauthenticated user"

    Scenario Outline: Invalid JWT token returns unauthorized error
        Given Enter a get vessel components payload <input> <dataObject>
        And Set vessel path parameter <vesselId>
        When Execute the getVesselComponents action with invalid JWT token
        Then The response should be an authentication error with message "Invalid token"

        Examples:
            | input                          | vesselId                             | dataObject         |
            | get-vessel-components-payload  | e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b | success_payload    |

    Scenario: Successfully get multiple components for a vessel
        Given Enter a get vessel components payload get-vessel-components-payload multiple_items
        And Set vessel path parameter e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b
        And Wait for component repository response ok components-mock multiple_items
        When Execute the getVesselComponents action with JWT token
        Then The response should contain components list multiple_items

    Scenario: Get vessel components with different vessel ID uses correct path parameter
        Given Enter a get vessel components payload get-vessel-components-payload different_vessel
        And Set vessel path parameter d6c5b4a3-f2e1-4d9c-8b7a-6f5e4d3c2b1a
        And Wait for component repository response ok components-mock vessel_002_components
        When Execute the getVesselComponents action with JWT token
        Then The response should contain correct vessel components

    Scenario: Get vessel components when no components exist for vessel
        Given Enter a get vessel components payload get-vessel-components-payload no_components
        And Set vessel path parameter c5b4a3f2-e1d9-4c8b-8a6f-5e4d3c2b1a9f
        And Wait for component repository response ok components-mock empty_components
        When Execute the getVesselComponents action with JWT token
        Then The response should be an empty components array

    Scenario: Get vessel components with valid tenant validation
        Given Enter a get vessel components payload get-vessel-components-payload valid_tenant
        And Set vessel path parameter e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b
        And Wait for component repository response ok components-mock tenant_validated_components
        When Execute the getVesselComponents action with JWT token
        Then Each component should have customerId matching authenticated user

    Scenario: Get vessel components with different customer should not return cross-tenant data
        Given Enter a get vessel components payload get-vessel-components-payload different_customer
        And Set vessel path parameter e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b
        And Wait for component repository response ok components-mock empty_components
        When Execute the getVesselComponents action with different customer JWT token
        Then The response should be an empty components array

    Scenario: Get vessel components returns all required fields
        Given Enter a get vessel components payload get-vessel-components-payload full_fields
        And Set vessel path parameter e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b
        And Wait for component repository response ok components-mock components_with_full_fields
        When Execute the getVesselComponents action with JWT token
        Then Each component record should have id, name, vesselId, customerId, serialNumber, installedAt

    Scenario: Get vessel components with invalid vessel ID returns empty array
        Given Enter a get vessel components payload get-vessel-components-payload invalid_vessel
        And Set vessel path parameter b4a3f2e1-d9c8-4b7a-8f5e-4d3c2b1a0f9e
        And Wait for component repository response ok components-mock empty_components
        When Execute the getVesselComponents action with JWT token
        Then The response should be an empty components array

    Scenario: Get vessel components validates tenant middleware protection
        Given Enter a get vessel components payload get-vessel-components-payload tenant_protection
        And Set vessel path parameter 061658b9-bf29-4e88-b0ec-c92ff540ac99
        And Wait for component repository response ok components-mock tenant_protected_components
        When Execute the getVesselComponents action with JWT token
        Then The response verify tenant middleware applied correctly

    Scenario: Get vessel components with single result validation
        Given Enter a get vessel components payload get-vessel-components-payload single_item
        And Set vessel path parameter 061658b9-bf29-4e88-b0ec-c92ff540ac99
        And Wait for component repository response ok components-mock single_component
        When Execute the getVesselComponents action with JWT token
        Then The response should contain exactly 1 component record
        And The component should have name and serialNumber populated
