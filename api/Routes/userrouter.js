const express = require("express");
const Links = express.Router();
const ErrorHandler = require("../utils/errorhandle");
const User = require("../model/usermodel");
const sendTokens = require("../utils/jwttoken");
const jwt = require("jsonwebtoken");
const error = require("../middleware/error");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// const sendToken = require("../utils/jwttoken");
// const isauthantication = require("../middleware/authentication");

var mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "profixinga@gmail.com",
    pass: "qmgxaqqspysldqet",
  },
});
Links.post("/", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      res.status(401).json("user already exist");
      return;
    } else {
      const newUser = new User({
        email: req.body.email,
        password: req.body.password,
        otp: Math.floor(1000 + Math.random() * 9000),
      });
      newUser.save((err, userData) => {
        if (err) {
          res.status(400).json("user not created");
          return;
        } else {
          const token = jwt.sign(
            { _id: userData._id },
            process.env.SECRET_KEY,
            {
              expiresIn: "2h",
            }
          );
          let userEmail = {
            from: "profixinga@gmail.com",
            to: userData.email,
            subject: "OTP for Signup",
            text: "Your OTP",
            html: `<!DOCTYPE html>
                <html lang="en">
                  <body>
                   <h3>Your OTP is Here</h3>
                   <h1>${userData.otp}</h1>
                  </body>
                </html>
                `,
          };

          console.log(userEmail);
          mailTransporter.sendMail(userEmail, function (err, data) {
            if (err) {
              res.status(400).json("Email not sent");
            } else {
              if (data !== null) {
                res.json({ userData, token });
              }
            }
          });
        }
      });
    }
  } catch (e) {
    res.status(500).json(e);
  }
});
Links.post("/otp", async (req, res) => {
  try {
    User.findOne({
      email: req.body.email,
      otp: req.body.otp,
    }).exec((err, data) => {
      if (err) {
        User.findOneAndDelete({ email: req.body.email }).exec((err, user) => {
          if (err) {
            res.status(400).json("user not delete");
          } else {
            res.status(400).json("Please enter correct OTP");
          }
        });
      } else {
        if (data !== null || data !== undefined) {
          res.json("SuccessFully Signup");
        } else {
          res.status(400).json("Please enter correct OTP");
        }
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
Links.put("/updatePassword", (req, res) => {
  console.log(req.body);
  try {
    User.findOneAndUpdate(
      { email: req.body.email },
      {
        $set: req.body,
      },
      {
        new: true,
        userFindAndModify: false,
      },
      (err, data) => {
        if (err) return res.status(400).json(err);
        else {
          let userEmail = {
            from: "profixinga@gmail.com",
            to: data.email,
            subject: "OTP for Signup",
            text: "Your OTP",
            html: `<!DOCTYPE html>
<html lang="en">
  <body>
   <h3>Your OTP is Here</h3>
   <h1>${data.otp}</h1>
  </body>
</html>
`,
          };

          console.log(userEmail);
          mailTransporter.sendMail(userEmail, function (err, data1) {
            if (err) {
              res.status(400).json("Email not sent");
            } else {
              if (data1 !== null) {
                res.json("email sent successfully");
              }
            }
          });
        }
      }
    );
  } catch (error) {
    return res.status(500).json(error);
  }
});
Links.post("/login", async (req, res, next) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).json("User Not Found");
    }
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );

    if (user !== null) {
      const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "2h",
      });
      if (req.body.password !== user.password) {
        res.status(400).json("password not Match");
      } else {
        res.json({
          user,
          token,
        });
      }
    } else {
      res.status(400).json("User Not Found");
    }
  } catch (e) {
    res.status(500).json(e);
  }
});
Links.get("/logout", async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Log Out succees",
    });
  } catch (e) {
    res.status(500).json(e);
  }
});
Links.get("/forget", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const restToken = user.restpasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetpasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}user/resetpassword/${restToken}`;
    const message = `Your password reset token is :- \n\n ${resetpasswordUrl} \n\n if you have not requestd this email then please ignore it`;
    res.json(message);
  } catch (e) {
    res.status(500).json(e);
  }
});
Links.put("/resetpassword/:token", async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordexpire: { $gt: Date.now() },
    });
    if (req.body.password !== req.body.confirmpassword) {
      return next(new ErrorHandler(error.message, 404));
    }
    user.password = req.body.password;
    user.resetPasswordtoken = undefined;
    user.resetPasswordexpire = undefined;
    await user.save();
    sendTokens(user, 200, res);
  } catch (e) {
    res.status(500).json(e);
  }
});
module.exports = Links;
