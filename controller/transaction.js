const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isAgent, isAdmin } = require("../middleware/auth");
const Transaction = require("../model/transaction");
const Property = require("../model/property");


// create new transaction
router.post(
  "/create-transaction",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, billingAddress, user, totalPrice, paymentInfo } = req.body;

      //   group cart items by agentId
      const agentItemsMap = new Map();

      for (const item of cart) {
        const agentId = item.agentId;
        if (!agentItemsMap.has(agentId)) {
          agentItemsMap.set(agentId, []);
        }
        agentItemsMap.get(agentId).push(item);
      }

      // create a transaction for each agent
      const transactions = [];

      for (const [agentId, items] of agentItemsMap) {
        const transaction = await Transaction.create({
          cart: items,
          billingAddress,
          user,
          totalPrice,
          paymentInfo,
        });
        transactions.push(transaction);
      }

      res.status(201).json({
        success: true,
        transactions,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all transactions of user
router.get(
  "/get-all-transactions/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const transactions = await Transaction.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        transactions,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all transactions of agent
router.get(
  "/get-agent-all-transactions/:agentId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const transactions = await Transaction.find({
        "cart.agentId": req.params.agentId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        transactions,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update transaction status for agent
router.put(
  "/update-transaction-status/:id",
  isAgent,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return next(new ErrorHandler("Transaction not found with this id", 400));
      }
      if (req.body.status === "Transferred to delivery partner") {
        transaction.cart.forEach(async (t) => {
          await updateTransaction(t._id, t.qty);
        });
      }

      transaction.status = req.body.status;

      if (req.body.status === "Completed") {
        transaction.completedAt = Date.now();
        transaction.paymentInfo.status = "Succeeded";
        const serviceCharge = transaction.totalPrice * 0.10;
        await updateAgentInfo(transaction.totalPrice - serviceCharge);
      }

      await transaction.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        transaction,
      });

      async function updateTransaction(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }

      async function updateAgentInfo(amount) {
        const agent = await Property.findById(req.agent.id);
        
        agent.availableBalance = amount;

        await agent.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// give a refund ----- user
router.put(
  "/transaction-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return next(new ErrorHandler("Transaction not found with this id", 400));
      }

      transaction.status = req.body.status;

      await transaction.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        transaction,
        message: "Transaction Refund Request successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- agent
router.put(
  "/transaction-refund-success/:id",
  isAgent,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return next(new ErrorHandler("Transaction not found with this id", 400));
      }

      transaction.status = req.body.status;

      await transaction.save();

      res.status(200).json({
        success: true,
        message: "Transaction Refund successful!",
      });

      if (req.body.status === "Refund Success") {
        transaction.cart.forEach(async (t) => {
          await updateTransaction(t._id, t.qty);
        });
      }

      async function updateTransaction(id, qty) {
        const product = await Product.findById(id);

        product.stock += qty;
        product.sold_out -= qty;

        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all transactions --- for admin
router.get(
  "/admin-all-transactions",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const transactions = await Transaction.find().sort({
        completedAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        transactions,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
