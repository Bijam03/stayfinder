import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  // Create the token with user's ID inside it
  const token = jwt.sign(
    { id: userId },                    // Data stored inside token
    process.env.JWT_SECRET,            // Secret key to sign the token
    { expiresIn: process.env.JWT_EXPIRE } // Token expires in 7 days
  );

  // Store token in a cookie (more secure than localStorage)
  res.cookie("token", token, {
    httpOnly: true,      // JavaScript cannot access this cookie
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",  // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;
};

export default generateToken;