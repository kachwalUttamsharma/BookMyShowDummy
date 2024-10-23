const router = require("express").Router();
const {
  makePayment,
  bookShow,
  getAllBookings,
  makePaymentAndBookShow,
} = require("../controllers/BookingController");

router.post("/makePayment", makePayment);
router.post("/bookShow", bookShow);
router.get("/getAllBookings", getAllBookings);
router.post("/makePaymentAndBookShow", makePaymentAndBookShow);

module.exports = router;
