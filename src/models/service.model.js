import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
    },
    price: {type: String, required: true},
    duration: {type: String, required: true},
    thumbnail: {type: String},
    day: {type: String, required: true},
    date: {type: String, required: true},
    time: {
        start_time: {type: String, required: true},
        end_time: {type: String, required: true},
    },
    bank_account: {
        account_number: {type: String, required: true},
        ifsc_code: {type: String, required: true},
        account_holder_name: {type: String, required: true},
        pan_number: {type: String, required: true},
        upi_id: {type: String},
    },
    gallery: [{type: String}],

    //todo -> yaha pe sirf ek hi status hi hoga ussi ke through sab data milega user ka + service id ka + booking Id ka 

    status: {
        type: String,
        enum: ["Upcoming", "Completed", "Cancelled", "Booked"],
        default: "Upcoming"
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Partner"
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    }
}, {timestamps: true});

export const Service = mongoose.model("Service", serviceSchema);