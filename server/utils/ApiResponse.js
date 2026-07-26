/**
 * Standardised success response wrapper.
 * Every successful controller response uses this shape so the
 * frontend can rely on a consistent { success, message, data } envelope.
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, data, 'Products fetched'));
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
