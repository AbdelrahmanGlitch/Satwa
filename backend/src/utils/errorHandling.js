export const asyncHandler = (fn)=> {
    return (req,res,next)=>{
        fn(req,res,next).catch((error)=>{
            return next(error)
        })
    }
}
 
export const globalErrorHandling = (err,req,res,next)=> {
    const payload = { message: err.message }
    if (err.errors) payload.errors = err.errors
    return res.status(err.cause || 500).json(payload)
}