import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    booking_date: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    payment_status: {
        type: Boolean,
        default: false,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    serviceId: {type: mongoose.Schema.Types.ObjectId, ref: "Service"},
}, {timestamps: true});

export const Booking = mongoose.model("Booking", bookingSchema);