export const validation = (schema)=>{
    return (req,res,next)=>{
        const validationResults = [];
        for(const key of Object.keys(schema)){
            const validationError = schema[key].validate(req[key], {abortEarly: false})
            if(validationError.error) {
                validationResults.push(...validationError.error.details);
            }
        }
        if(validationResults.length > 0) {
            // Lead with the first specific problem (e.g. "\"name\" must only
            // contain alpha-numeric characters") instead of a bare
            // "Validation Error" that gives the caller nothing to act on —
            // the full list still travels in `errors` for anyone reading it.
            const error = new Error(validationResults[0].message)
            error.errors = validationResults
            error.cause = 400
            return next(error)
        }
        next()
    }
}