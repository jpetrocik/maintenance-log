const EXCEPTIONS = {
    NO_SUCH_USER: {
        code: 100,
        msg: 'User not found'
    },
    INVALID_VALIDATION_CODE: {
        code: 101,
        msg: "Invalid validation code"
    },
    LOGIN_FAILED: {
        code: 102,
        msg: "Login failed"
    },
    ACCESS_DENIED: {
        code: 103,
        msg: "Access denied"
    },
    USER_EXISTS: {
        code: 104,
        msg: "User already exists"
    },
    REQUIRED_PARAMETER: {
        code: 301,
        msg: "Missing parameter"
    },
    INVITATION_EXISTS: {
        code: 401,
        msg: "Invitation exists"
    },
    GENERIC_SQL_ERROR: {
        code: 501,
        msg: "Unexpected error"
    },
    msg: function(exception, message) {
        exception.msg = message;
        return exception;
    }

}

module.exports = EXCEPTIONS;