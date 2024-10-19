class ApiError extends Error {
    constructor(status, message="Something Went Wrong", error=[], stack=""){
        super(message);
        this.status = status;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = error;
    }
}


export { ApiError };