const stripe = require("stripe")(process.env.stripe_key);
const Booking = require("../models/BookingSchema");
const Show = require("../models/showSchema");
const EmailHelper = require("../utils/emailHelper");
const mongoose = require("mongoose");

const makePayment = async (req, res) => {
  try {
    const { token, amount } = req.body;
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      customer: customer.id,
      payment_method_types: ["card"],
      receipt_email: token.email,
      description: "Token has been assigned to the movie!",
    });

    const transactionId = paymentIntent.id;

    res.send({
      success: true,
      message: "Payment Successful! Ticket(s) booked!",
      data: transactionId,
    });
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const bookShow = async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();

    const show = await Show.findById(req.body.show).populate("movie");
    const updatedBookedSeats = [...show.bookedSeats, ...req.body.seats];
    await Show.findByIdAndUpdate(req.body.show, {
      bookedSeats: updatedBookedSeats,
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "movies",
        },
      })
      .populate({
        path: "show",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      });

    res.send({
      success: true,
      message: "New Booking done!",
      data: populatedBooking,
    });

    await EmailHelper("ticketTemplate.html", populatedBooking.user.email, {
      name: populatedBooking.user.name,
      movie: populatedBooking.show.movie.movieName,
      theatre: populatedBooking.show.theatre.name,
      date: populatedBooking.show.date,
      time: populatedBooking.show.time,
      seats: populatedBooking.seats,
      amount: populatedBooking.seats.length * populatedBooking.show.ticketPrice,
      transactionId: populatedBooking.transactionId,
    });
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.body.userId })
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "movies",
        },
      })
      .populate({
        path: "show",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      });

    res.send({
      success: true,
      message: "Bookings fetched!",
      data: bookings,
    });
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const makePaymentAndBookShow = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token, amount, show: showId, seats } = req.body;

    // Step 1: Check if the customer already exists in Stripe
    const customers = await stripe.customers.list({
      email: token.email,
      limit: 1,
    });

    let currCustomer;
    if (customers.data.length > 0) {
      currCustomer = customers.data[0]; // Use the existing customer
    } else {
      // Create a new customer if no existing one is found
      currCustomer = await stripe.customers.create({
        email: token.email,
        source: token.id,
      });
    }

    // Step 2: Create the payment intent using the customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      customer: currCustomer.id, // Use the existing or newly created customer ID
      payment_method_types: ["card"],
      receipt_email: token.email,
      description: "Payment for movie booking!",
    });

    const transactionId = paymentIntent.id;

    // Step 3: Booking the show if payment is successful
    const show = await Show.findById(showId).populate("movie").session(session);

    // Check if any seat is already booked
    const seatAlreadyBooked = seats.some((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (seatAlreadyBooked) {
      throw new Error("One or more seats are already booked.");
    }

    // Update the booked seats atomically
    const updatedBookedSeats = [...show.bookedSeats, ...seats];

    // Save the updated seats into the show document
    await Show.findByIdAndUpdate(
      showId,
      {
        bookedSeats: updatedBookedSeats,
      },
      { session }
    );

    // Step 4: Create the booking
    const newBooking = new Booking({
      ...req.body,
      transactionId, // Attach the transaction ID to the booking
    });
    await newBooking.save({ session });

    // Populate the booking for response
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: { path: "movie", model: "movies" },
      })
      .populate({
        path: "show",
        populate: { path: "theatre", model: "theatres" },
      })
      .session(session);

    // Step 5: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send success response
    res.send({
      success: true,
      message: "Payment and Booking successful!",
      data: populatedBooking,
    });

    // Step 6: Send confirmation email
    await EmailHelper("ticketTemplate.html", populatedBooking.user.email, {
      name: populatedBooking.user.name,
      movie: populatedBooking.show.movie.movieName,
      theatre: populatedBooking.show.theatre.name,
      date: populatedBooking.show.date,
      time: populatedBooking.show.time,
      seats: populatedBooking.seats,
      amount: populatedBooking.seats.length * populatedBooking.show.ticketPrice,
      transactionId: populatedBooking.transactionId,
    });
  } catch (err) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();

    // If payment was made but booking failed, optionally handle refund
    if (err.message.includes("seats are already booked")) {
      await stripe.refunds.create({ payment_intent: paymentIntent.id });
    }

    res.send({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  makePayment,
  getAllBookings,
  bookShow,
  makePaymentAndBookShow,
};
