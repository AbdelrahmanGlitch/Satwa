// multipart/form-data (used whenever a route also accepts file uploads)
// only carries plain strings — an array/object field like `collections` or
// `notes` has to travel as a JSON string and get parsed back out before
// Joi validation ever sees it. Left alone (not a string, or invalid JSON)
// so a plain JSON request or a validation error surfaces normally.
export const parseJsonFields = (fields = []) => (req, res, next) => {
    for (const field of fields) {
        const value = req.body?.[field];
        if (typeof value === "string") {
            try {
                req.body[field] = JSON.parse(value);
            } catch {
                // leave as-is; Joi will reject it with a clear message
            }
        }
    }
    next();
}