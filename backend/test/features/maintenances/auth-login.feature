Feature: Authentication - Login

    Scenario Outline: Executing login service
        Given Enter a login payload <input> <dataObject>
        And Wait for user repository response <status> <mockData> <mockObject>
        When Execute the login action
        Then The response will be displayed <status> <result> <dataObject>

        Examples:
            | input              | status | dataObject          | mockData        | mockObject          | result               |
            | auth-login-payload | ok     | success_payload     | auth-login-mock | success_payload     | auth-login-response  |
            | auth-login-payload | error  | invalid_credentials | auth-login-mock | invalid_credentials | auth-login-error     |
            | auth-login-payload | error  | user_not_found      | auth-login-mock | user_not_found      | auth-login-error     |

    Scenario Outline: Bad request - Missing fields returns validation error
        Given Enter a login payload <input> <dataObject>
        When Execute the login action
        Then The response will be displayed with errors <result> <dataObject>

        Examples:
            | input              | dataObject       | result           |
            | auth-login-payload | missing_username | auth-login-error |
            | auth-login-payload | missing_password | auth-login-error |
            | auth-login-payload | empty_payload    | auth-login-error |
