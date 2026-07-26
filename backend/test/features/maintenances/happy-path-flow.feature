Feature: Happy Path - Complete Maintenance Workflow

    Scenario: Complete flow from login to maintenance update
        Given A valid user with username tester and password correctPassword
        And The authentication repository returns a valid user
        When The user executes the login action
        Then A valid JWT authentication token is returned

        And The vessel repository returns vessels for customer 88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b
        When The user gets the vessel list with the obtained JWT
        Then The vessel list contains at least one vessel

        And The vessel and component repositories return data for vessel 061658b9-bf29-4e88-b0ec-c92ff540ac99
        When The user gets components for vessel 061658b9-bf29-4e88-b0ec-c92ff540ac99
        Then The component list contains at least one component for 061658b9-bf29-4e88-b0ec-c92ff540ac99

        And The component and maintenance repositories are ready for creation
        When The user creates a maintenance record for component c4e9f3e8-5c1a-4a2f-8b3c-9a8d7e6f5c4b
        Then The maintenance record is created with status pending

        And The maintenance repository is mocked for status update
        When The user updates the maintenance status to in_progress
        Then The maintenance status is successfully updated to in_progress
