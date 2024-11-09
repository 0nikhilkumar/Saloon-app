import { Partner } from "../models/partner.model.js";
import { Service } from "../models/service.model.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export const addService = asyncHandler(async (req, res)=> {

    const user = await User.findById(req.user?._id);

    if (!user) {
        return res.status(404).json(new ApiResponse(404, "Invalid Credentials"));
    }

    const role = user.role;
    if (role !== "Partner")
        return res
        .status(400)
        .json(new ApiResponse(400,"You are not a partner then you cannot setup these things")
    );

    const body = req.body;
    console.log("this is: ", body.serviceName);
    if(!body){
        return res.status(400).json(new ApiResponse(400, "Please fill all the fields"))
    }

    const getSericeTimeAndDate = convertIntoDateAndTimeFormat(body.date.toString(), body.endTime.toString());

    const currentDateAndTime = new Date(Date.now());


    if(!isServiceTimeIsBigger(getSericeTimeAndDate, currentDateAndTime)){
        return res.status(200).json(new ApiResponse(200, "Please enter the valid service time"));
    }

    const localThumbnail = req.file?.path;

    let thumbnail;
    if(localThumbnail){
        thumbnail = await uploadOnCloudinary(localThumbnail, "thumbnail");

        if(!thumbnail?.url){
            return res.status(403).json(new ApiResponse(403, "Something went wrong while adding the thumbnail"));
        }
    }

    const partner = await Partner.findOne({userId: req.user?._id});

    // console.log(partner);

    const addNewService = await Service.create({
        serviceName: body.serviceName,
        price: body.price,
        duration: body.duration,
        day: body.day,
        time: {
            start_time: body.startTime,
            end_time: body.endTime
        },
        date: body.date,
        thumbnail: thumbnail?.url || "",
        bank_account: {
            account_number: body.accountNumber,
            ifsc_code: body.ifscCode,
            account_holder_name: body.accountHolderName,
            pan_number: body.panNumber,
            upi_id: body.upiId,
        },
        partnerId: partner._id
    });

    const newPartner = await Partner.findByIdAndUpdate(partner._id, {
        $push: {
            service_id: addNewService._id,
        }
    });

    if(!newPartner){
        return res.status(403).json(new ApiResponse(403, "Service Id is not added in the partner"));
    }

    if(!addNewService){
        return res.status(400).json(new ApiResponse(400, "Something went wrong while adding the service"));
    }


    return res.status(201).json(new ApiResponse(201, "Service added successfully"));

});

export const uploadGallery = asyncHandler(async (req, res)=> {
    const { serviceId } = req.body;
    if(!serviceId){
        return res.status(403).json(new ApiResponse(403, "Please provide the service id"));
    }
    if(!req.files){
        return res.status(401).json(new ApiResponse(401, "Please provide the gallery images"));
    }

    const files = req.files.map(async (file)=> {
        return await uploadOnCloudinary(file.path, 'gallery')
    });

    const result = await Promise.all(files);
    const imageURL = result.map((item)=> item.url);
    
    const services = await Service.findByIdAndUpdate(serviceId, {
        $push: {
            gallery: imageURL,
        }
    });
    if(!services){
        return res.status(404).json(new ApiResponse(404, "Something went wrong while adding the gallery images"));
    }

    return res.status(201).json(new ApiResponse(201, "Gallery images added successfully", services));
});

export const getAllServicesOfPartner = asyncHandler(async (req, res)=> {
    const { id } = req.params;
    if(!id){
        return res.status(401).json(new ApiResponse(401, "Please provide the partner id"));
    }
    const getservices = await Service.findOne({ partnerId: id });
    if(!getservices){
        return res.status(404).json(new ApiResponse(404, "There is no any service of this saloon", getservices));
    }
    return res.status(200).json(new ApiResponse(200, "Service fetched successfully", getservices));
});