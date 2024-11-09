import { Booking } from "../models/booking.model.js";
import { Service } from "../models/service.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const convertIntoDateAndTimeFormat = (date, time) => {
    const [year1, month1, day1] = date.split("-").map(Number);
    const [hours1, minutes1] = time.split(":").map(Number);
    const datetime = new Date(year1, month1-1, day1, hours1, minutes1); 
    return datetime;
}

const isServiceTimeIsBigger = (serviceDateAndTime, currentDateAndTime) => {
    const service = new Date(serviceDateAndTime);
    const current = new Date(currentDateAndTime);
    return service > current ? true : false;
}

export const bookedBooking = asyncHandler(async (req, res)=> {
    const { id } = req.params;

    if(!id){
        return res.status(400).json(new ApiResponse(400, "Please provide the service Id"));
    };

    const getService = await Service.findById(id);
    if(!getService){
        return res.status(404).json(new ApiResponse(404, "Service not found"));
    }

    const getSericeTimeAndDate = convertIntoDateAndTimeFormat(getService.date.toString(), getService.time.end_time.toString());

    const currentDateAndTime = new Date(Date.now());


    if(!isServiceTimeIsBigger(getSericeTimeAndDate, currentDateAndTime)){
        getService.status = "Completed";
        return res.status(200).json(new ApiResponse(200, "It is already completed"));
    }

    if(getService.status === "Completed"){
        return res.status(200).json(new ApiResponse(200, "It is already completed, you cannot booked again"));
    }

    if(getService.status === "Booked"){
        return res.status(200).json(new ApiResponse(200, "Already booked")); 
    }

    //todo -> payment integration

    if(getService.status === "Upcoming" || (getService.status === "Cancelled" && isServiceTimeIsBigger(getSericeTimeAndDate, currentDateAndTime))){
        const bookingService = await Booking.create({
            payment_status: true,
            userId: req.user?._id,
            serviceId: id,
            status: "Booked",
        });
    
        getService.bookingId = bookingService._id;
        getService.status = "Booked";
        await getService.save();

        if(!bookingService){
            return res.status(401).json(new ApiResponse(401, "Service is not booked"));
        }
    }

    

    return res.status(201).json(new ApiResponse(201, "Service booked successfully"));
});

export const cancelledBooking = asyncHandler(async (req, res)=> {
    const {id} = req.params;
    if(!id){
        return res.status(400).json(new ApiResponse(400, "Please provide the service Id"));
    };


    const getService = await Service.findById(id);
    if(!getService){
        return res.status(404).json(new ApiResponse(404, "Service not found"));
    }

    const getSericeTimeAndDate = convertIntoDateAndTimeFormat(getService.date.toString(), getService.time.end_time.toString());

    const currentDateAndTime = new Date(Date.now());


    if(!isServiceTimeIsBigger(getSericeTimeAndDate, currentDateAndTime)){
        getService.status = "Completed";
        return res.status(200).json(new ApiResponse(200, "It is already completed"));
    }

    await Booking.findOneAndDelete({serviceId: id});

    getService.status = "Cancelled";
    await getService.save();
    
    return res.status(200).json(new ApiResponse(200, "Service Cancelled Successfully", getService));
});

