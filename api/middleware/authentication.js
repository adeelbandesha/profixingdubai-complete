const catchAsyncErrors = require("./catchAsyncerror");
const jwt = require("jsonwebtoken");
const User = require("../model/usermodel");
const Order = require("../model/ordermodel");
const Offer = require("../model/offers");

exports.isauthantication = catchAsyncErrors(async (req, res, next) => {
  console.log(req.cookies);
  const token1 = req.body.token;

  if (!token1) {
    return res.status(401).json("Please Login to access this resource");
  }

  const decodedData = jwt.verify(token1, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData._id);

  next();
});
exports.authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.body.role)) {
      return res
        .status(403)
        .json(`Role ${req.body.role} is not allowed to handle this`);
    }
  };
};
exports.createOrders = async (req, res, next) => {
  try {
    const order = new Order({
      date: req.body.date,
      time: Date.now(),
      onSurvey: req.body.onSurvey,
      units: req.body.units,
      subTotal: req.body.subTotal,
      discount: req.body.discount,
      total: req.body.total,
      ServiceOrIssue: req.body.ServiceOrIssue,
      furnished: req.body.furnished,
      location: {
        address: req.body.location.address,
        building: req.body.location.building,
        street: req.body.location.street,
        villNumber: req.body.location.villNumber,
        city: req.body.location.city,
        country: req.body.location.country,
      },
      serviceName: req.body.serviceName,
    });
    order.save((err, odr) => {
      if (err) {
        res.status(400).json(err);
      } else {
        if (odr) {
          req.order = odr;
          next();
        }
      }
    });
  } catch (e) {
    return res.status(500).json(error);
  }
};
exports.createOffer = async (req, res, next) => {
  try {
    const newOffer = new Offer({
      name: req.body.name,
      price: req.body.price,
      date: req.body.date,
      detail: {
        callout: req.body.detail.callout,
        ac: req.body.detail.ac,
        plumbing: req.body.detail.plumbing,
        electrical: req.body.detail.electrical,
        handyman: req.body.detail.handyman,
        spareParts: req.body.detail.spareParts,
      },
    });
    newOffer.save((err, offer) => {
      if (err) {
        res.status(400).json(err);
      } else {
        if (offer) {
          req.offers = offer;
          next();
        }
      }
    });
  } catch (e) {
    return res.status(500).json(e);
  }
};
