const router = require("express").Router();

const {
  addShow,
  deleteShow,
  updateShow,
  getAllShowsByTheatre,
  getAllTheatresByMovie,
  getShowById,
} = require("../controllers/showController");

// Add Show
router.post("/addShow", addShow);

router.delete("/deleteShow/:showId", deleteShow);

// Update mshow
router.put("/updateShow", updateShow);

router.post("/getAllShowsByTheatre", getAllShowsByTheatre);

// Get all theatres by movie which has some shows
router.post("/getAllTheatresByMovie", getAllTheatresByMovie);

router.post("/getShowById", getShowById);

module.exports = router;
