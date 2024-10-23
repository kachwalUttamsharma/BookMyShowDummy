import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideLoading, showLoading } from "../redux/loaderSlice";
import { getShowById } from "../api/show";
import { useNavigate, useParams } from "react-router-dom";
import { message, Card, Row, Col, Button } from "antd";
import moment from "moment";
import { bookShow, makePayment, makePaymentAndBookShow } from "../api/booking";
import StripeCheckout from "react-stripe-checkout";

const BookShow = () => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [show, setShow] = useState();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const params = useParams();
  const navigate = useNavigate();
  const getData = async () => {
    try {
      dispatch(showLoading());
      const response = await getShowById({ showId: params.id });
      if (response.success) {
        setShow(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(hideLoading());
    } catch (err) {
      message.error(err.message);
      dispatch(hideLoading());
    }
  };

  const getSeats = () => {
    let columns = 12;
    let totalSeats = show.totalSeats;
    let rows = Math.ceil(totalSeats / columns);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="w-100 max-width-600 mx-auto mb-25px">
          <p className="text-center mb-10px">
            Screen this side, you will be watching in this direction
          </p>
          <div className="screen-div"></div>
        </div>
        <ul className="seat-ul justify-content-center">
          {Array.from(Array(rows).keys()).map((row) => {
            return Array.from(Array(columns).keys()).map((column) => {
              let seatNumber = row * columns + column + 1;
              let seatClass = "seat-btn";
              if (selectedSeats.includes(seatNumber)) {
                seatClass += " selected";
              }
              if (show.bookedSeats.includes(seatNumber)) {
                seatClass += " booked";
              }
              if (seatNumber <= totalSeats)
                return (
                  <li>
                    <button
                      onClick={() => {
                        if (!seatClass.split(" ").includes("booked")) {
                          if (selectedSeats.includes(seatNumber)) {
                            setSelectedSeats(
                              selectedSeats.filter(
                                (curSeatNumber) => curSeatNumber !== seatNumber
                              )
                            );
                          } else {
                            setSelectedSeats([...selectedSeats, seatNumber]);
                          }
                        }
                      }}
                      className={seatClass}
                    >
                      {seatNumber}
                    </button>
                  </li>
                );
            });
          })}
        </ul>

        <div className="d-flex bottom-card justify-content-between w-100 max-width-600 mx-auto mb-25px mt-3">
          <div className="flex-1">
            Selected Seats: <span>{selectedSeats.join(", ")}</span>
          </div>
          <div className="flex-shrink-0 ms-3">
            Total Price:
            <span>Rs. {selectedSeats.length * show.ticketPrice}</span>
          </div>
        </div>
      </div>
    );
  };

  const book = async (transactionId) => {
    try {
      dispatch(showLoading());
      const response = await bookShow({
        show: params.id,
        transactionId,
        seats: selectedSeats,
        user: user._id,
      });
      if (response.success) {
        message.success("Show Booking done!");
        navigate("/profile");
      } else {
        message.error(response.message);
      }
      dispatch(hideLoading());
    } catch (err) {
      message.error(err.message);
      dispatch(hideLoading());
    }
  };

  const onToken = async (token) => {
    try {
      dispatch(showLoading());
      const response = await makePayment(
        token,
        selectedSeats.length * show.ticketPrice
      );
      if (response.success) {
        message.success(response.message);
        book(response.data);
        console.log(response);
      } else {
        message.error(response.message);
      }
      dispatch(hideLoading());
    } catch (err) {
      message.error(err.message);
      dispatch(hideLoading());
    }
  };
  const bookAndPay = async (token) => {
    try {
      dispatch(showLoading());

      // Prepare the data for the merged API call
      const response = await makePaymentAndBookShow({
        token, // Stripe token for payment
        amount: selectedSeats.length * show.ticketPrice, // Total amount for seats
        show: params.id, // The show being booked
        seats: selectedSeats, // The seats selected by the user
        user: user._id, // User ID
      });

      if (response.success) {
        message.success("Payment and Booking successful!");
        navigate("/profile"); // Redirect to profile on success
      } else {
        message.error(response.message); // Handle errors from server
      }

      dispatch(hideLoading());
    } catch (err) {
      message.error(err.message); // Catch any unexpected errors
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      {show && (
        <Row gutter={24}>
          <Col span={24}>
            <Card
              title={
                <div className="movie-title-details">
                  <h1>{show.movie.title}</h1>
                  <p>
                    Theatre: {show.theatre.name}, {show.theatre.address}
                  </p>
                </div>
              }
              extra={
                <div className="show-name py-3">
                  <h3>
                    <span>Show Name:</span> {show.name}
                  </h3>
                  <h3>
                    <span>Date & Time: </span>
                    {moment(show.date).format("MMM Do YYYY")} at{" "}
                    {moment(show.time, "HH:mm").format("hh:mm A")}
                  </h3>
                  <h3>
                    <span>Ticket Price:</span> Rs. {show.ticketPrice}/-
                  </h3>
                  <h3>
                    <span>Total Seats:</span> {show.totalSeats}
                    <span> &nbsp;|&nbsp; Available Seats:</span>{" "}
                    {show.totalSeats - show.bookedSeats.length}{" "}
                  </h3>
                </div>
              }
              style={{ width: "100%" }}
            >
              {getSeats()}

              {selectedSeats.length > 0 && (
                <StripeCheckout
                  token={bookAndPay}
                  amount={selectedSeats.length * show.ticketPrice}
                  billingAddress
                  stripeKey="pk_test_51O5zcBSBDTkZoZSYLMhGUO2MTmaOGJ2zaVA8RuqLn35meiJiQUAzM8HKHgNYXJAGnRSf335yH7rYZQCJ8G6uPIrU00VLrpUJX9"
                >
                  <div className="max-width-600 mx-auto">
                    <Button type="primary" shape="round" size="large" block>
                      Pay Now
                    </Button>
                  </div>
                </StripeCheckout>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};
export default BookShow;
