const Razorpay = require("razorpay");
const mongoose = require("mongoose");

// Connect to MongoDB (for Vercel serverless)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Simple Transaction Schema
const transactionSchema = new mongoose.Schema({
  amount: Number,
  orderId: String,
  status: {
    type: String,
    default: "created",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    // Save transaction in DB
    await Transaction.create({
      amount,
      orderId: order.id,
      status: "created",
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({ error: "Order creation failed" });
  }
};