// Check that your deployment worked, and that your POSTMARK_KEY is initialized properly.
// Delete this function after testing - do not deploy to PROD.

export const hello = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `${process.env.POSTMARK_KEY}`,
    }),
  };

  callback(null, response);
};
