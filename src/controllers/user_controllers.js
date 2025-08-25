import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "ID Token is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
        googleId,
        username: email.split("@")[0],
      });
      await user.save();
      logger.info(`Created new user via Google Sign-In: ${user._id}`);
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Google sign-in successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture,
      },
    });
  } catch (error) {
    logger.error("ERROR_GOOGLE_SIGNIN", error);
    res.status(500).json({
      success: false,
      message: "Google sign-in failed",
      error: error.message,
    });
  }
};
