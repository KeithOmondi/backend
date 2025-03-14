const express = require("express");
const { isSeller, isAuthenticated, isAdmin, isAgent } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Listing = require("../model/listing");
const Transaction = require("../model/transaction");
const Property = require("../model/property");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");

// create listing
router.post(
  "/create-listing",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const propertyId = req.body.propertyId;
      const property = await Property.findById(propertyId);
      if (!property) {
        return next(new ErrorHandler("Property Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }
      
        const imagesLinks = [];
      
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "listings",
          });
      
          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
      
        const listingData = req.body;
        listingData.images = imagesLinks;
        listingData.property = property;

        const listing = await Listing.create(listingData);

        res.status(201).json({
          success: true,
          listing,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all listings of a property
router.get(
  "/get-all-listings-property/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const listings = await Listing.find({ propertyId: req.params.id });

      res.status(201).json({
        success: true,
        listings,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete listing of a property
router.delete(
    "/delete-property-listing/:id",
    isAgent,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const property = await Property.findById(req.params.id);
  
        if (!property) {
          return next(new ErrorHandler("Property listing not found with this ID", 404));
        }
  
        // Remove images from Cloudinary
        for (let i = 0; i < property.images.length; i++) {
          await cloudinary.v2.uploader.destroy(property.images[i].public_id);
        }
  
        await property.deleteOne(); // Use deleteOne() instead of remove()
  
        res.status(200).json({
          success: true,
          message: "Property listing deleted successfully!",
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 400));
      }
    })
  );
  

// get all listings
router.get(
  "/get-all-listings",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const listings = await Listing.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        listings,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// review for a listing
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, listingId, transactionId } = req.body;

      const listing = await Listing.findById(listingId);

      const review = {
        user,
        rating,
        comment,
        listingId,
      };

      const isReviewed = listing.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        listing.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
          }
        });
      } else {
        listing.reviews.push(review);
      }

      let avg = 0;

      listing.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      listing.ratings = avg / listing.reviews.length;

      await listing.save({ validateBeforeSave: false });

      await Transaction.findByIdAndUpdate(
        transactionId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": listingId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all listings --- for admin
router.get(
  "/admin-all-listings",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const listings = await Listing.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        listings,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
