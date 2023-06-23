const express = require("express");
const { isauthantication } = require("../middleware/authentication");
const Route = express.Router();
const Offer = require("../model/offers");
const nodemailer = require("nodemailer");
const { createOffer } = require("../middleware/authentication");

var mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "profixinga@gmail.com",
    pass: "qmgxaqqspysldqet",
  },
});

Route.post("/getByName", isauthantication, (req, res) => {
  try {
    Offer.findOne({ name: req.body.name }).exec((err, data) => {
      if (err) {
        res.status(400).json(err);
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});

Route.post("/allOffers", (req, res) => {
  try {
    Offer.find().exec((err, data) => {
      if (err) {
        res.status(400).json(err);
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});

Route.delete("/:id/deleteOffers", isauthantication, (req, res) => {
  try {
    Offer.findOneAndDelete({ _id: req.params.id }).exec((err, data) => {
      if (err) {
        res.status(400).json(err);
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});

Route.put("/:id/updateOffers", isauthantication, (req, res) => {
  console.log(req.body);
  try {
    Offer.findOneAndUpdate(
      { _id: req.params._id },
      {
        $set: req.body,
      },
      {
        new: true,
        userFindAndModify: false,
      },
      (err, data) => {
        if (err) return res.status(400).json(err);
        return res.json(data);
      }
    );
  } catch (error) {
    return res.status(500).json(error);
  }
});

Route.post("/create", isauthantication, createOffer, (req, res, next) => {
  console.log('req.body:: ', req.body)
  let userEmail = {
    from: req.body.from,
    to: "profixinga@gmail.com",
    subject: "Offer Selected By User",
    text: `Offer Selected by this User is ${req.offers.name}`,
  };

  console.log(userEmail);
  mailTransporter.sendMail(userEmail, function (err, data) {
    if (err) {
      res.status(400).json(err);
    } else {
      if (data !== null) {
        res.json(req.offers);
      }
    }
  });
});

Route.post("/contactMail", (req, res, next) => {
  let userEmail = {
    from: req.body.email,
    to: "profixinga@gmail.com",
    subject: "Contact Mail by User",
    text: `User Name ${req.body.name}  Email of User ${req.body.email}  Number of User ${req.body.contact}  Address Of User ${req.body.address}  text by User ${req.body.text}`,
  };

  console.log(userEmail);
  mailTransporter.sendMail(userEmail, function (err, data) {
    if (err) {
      res.status(400).json("Email not Sent");
    } else {
      if (data !== null) {
        res.json("Email Sent SuccessFully");
      }
    }
  });
});

module.exports = Route;
