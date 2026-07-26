Feature: Get Vessels - Retrieve all vessels for authenticated user

    Scenario Outline: Executing get vessels service with valid authentication
        Given Enter a get vessels payload <input> <dataObject>
        And Wait for vessel repository response <status> <mockData> <mockObject>
        When Execute the getVessels action with JWT token
        Then The response will be displayed <result> <dataObject>

        Examples:
            | input               | status | dataObject      | mockData       | mockObject      | result            |
            | get-vessels-payload | ok     | success_payload | vessels-mock   | success_payload | vessels-response  |
            | get-vessels-payload | ok     | empty_vessels   | vessels-mock   | empty_vessels   | vessels-response  |

    Scenario: Unauthorized - Missing authentication header returns 401
        Given Enter a get vessels payload get-vessels-payload no_auth
        When Execute the getVessels action without JWT token
        Then The response should be an authentication error with message "Unauthenticated user"

    Scenario Outline: Invalid JWT token returns unauthorized error
        Given Enter a get vessels payload <input> <dataObject>
        When Execute the getVessels action with invalid JWT token
        Then The response should be an authentication error with message "Invalid token"

        Examples:
            | input               | dataObject      |
            | get-vessels-payload | success_payload |
