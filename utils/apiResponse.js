
// utils/apiResponse.js
  const apiResponse = ({
  res,
  success = true,
  message = "",
  data = null,
  pagination = null,
  statusCode = 200
}) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    pagination
  });
};

module.exports={apiResponse}