const router = require("express").Router();
const {
  addTheatre,
  updateTheatre,
  deleteTheatre,
  getAllTheatres,
  getAllTheatreByOwner,
} = require("../controllers/theatreController");

router.post("/addTheatre", addTheatre);

// Update theatre
router.patch("/updateTheatre", updateTheatre);

// Delete theatre
router.delete("/deleteTheatre/:theatreId", deleteTheatre);

router.get("/getAllTheatres", getAllTheatres);

router.post("/getAllTheatresByOwner", getAllTheatreByOwner);

module.exports = router;
