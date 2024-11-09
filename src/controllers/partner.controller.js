import { Partner } from "../models/partner.model.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const setupProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    return res.status(404).json(new ApiResponse(404, "Invalid Credentials"));
  }

  const role = user.role;
  if (role !== "Partner")
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "You are not a partner then you cannot setup these things"
      )
  );

  // const isAlreadyShop = await Partner.findOne({ userId: req.user?._id });

  // if (isAlreadyShop) {
  //   return res
  //     .status(401)
  //     .json(new ApiResponse(401, "Partner Can Create only one shop"));
  // }

  const { shopName, shopNo, cityName, state, pincode, email, contact_number, latitude, longitude } =
    req.body;

  const { social_media_links, additional_name } = req.body;

  if (
    [shopName, shopNo, cityName, state, pincode, email, contact_number, latitude, longitude].some((field) => field?.trim() === "")) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Please fill all the fields"));
  }

  const alreadyShop = await Partner.findOne({
    $or: [{ shopName }, { "address.shop_no": shopNo }],
  });

  if (alreadyShop) {
    return res
      .status(403)
      .json(new ApiResponse(403, "Already reserved shopname and shopnumber"));
  }

  const addingBusinessInfo = await Partner({
    shopName,
    address: {
      shop_no: shopNo,
      city_name: cityName,
      additional_name: additional_name || "",
      state,
      pincode,
    },
    email,
    contact_number,
    location: {
      type: "Point",
      coordinates: [parseFloat(latitude), parseFloat(longitude)]
    },
    userId: req.user?._id || "",
  });

  const added = await addingBusinessInfo.save();

  if (!added) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          "Something went wrong while creating the shop setup"
        )
      );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Shop Created successfully", added));
});

export const updatePartnerProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    return res.status(404).json(new ApiResponse(404, "Invalid Credentials"));
  }

  const role = user.role;
  if (role !== "Partner")
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "You are not a partner then you cannot setup these things"
        )
      );

  const { shopName, shopNo, cityName, state, pincode } = req.body;

  const { social_media_links, additional_name } = req.body;

  const partnerShop = await Partner.find();

  const updatedPartnerShop = await Partner.findByIdAndUpdate(
    partnerShop[0]._id,
    {
      $set: {
        shopName: shopName ? shopName : partnerShop.shopName,
        address: {
          shop_no: shopNo ? shopNo : partnerShop.shopName,
          city_name: cityName ? cityName : partnerShop[0].address?.city_name,
          additional_name: additional_name
            ? additional_name
            : partnerShop[0].address?.additional_name,
          state: state ? state : partnerShop[0].address?.state,
          pincode: pincode ? pincode : partnerShop[0].address?.pincode,
        },
      },
    },
    { new: true }
  );


  if (!updatedPartnerShop) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          "Something went wrong while updating the partner shop"
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Partner shop updated Successfully"));
});

export const gettingAllPartners = asyncHandler(async (req, res)=> {  

  const allPartnerss = await Partner.aggregate([
    {
      $lookup: {
        from: "services",        
        localField: "service_id", 
        foreignField: "_id",      
        as: "services"            
      }
    },
  
    {
      $lookup: {
        from: "users",            
        localField: "userId",     
        foreignField: "_id",      
        as: "user"                
      }
    },
  
    
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  
    {
      $project: {
        shopName: 1,
        address: 1,
        email: 1,
        contact_number: 1,
        social_media_links: 1,
        "services.price": 1,   
        "services.serviceName": 1,   
        "services.duration": 1,   
        "services.day": 1,   
        "services.thumbnail": 1,   
        "services.time.start_time": 1,   
        "services.time.end_time": 1,   
        "services.gallery": 1,   
        "user.fullname": 1,      
        "user.username": 1,      
        "user.email": 1,      
        "user.phoneNumber": 1, 
        "user.profileImageUrl": 1,     
        "user.gender": 1,     
        "user.location": 1,     
        "user.isVerified": 1,    
        "user.role": 1,  
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  if(!allPartnerss || allPartnerss.length === 0){
    return res.status(404).json(new ApiResponse(404, "Empty Partner list"));
  }

  return res.status(200).json(new ApiResponse(200, "Partner is successfully fetched", allPartnerss));
});

export const getNearbySaloon = asyncHandler(async (req, res)=> {

  const user = await User.findById(req.user?._id);

  if (!user) {
    return res.status(404).json(new ApiResponse(404, "Invalid Credentials"));
  }

  const role = user.role;
  if (role !== "User")
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "You are not a partner then you cannot setup these things"
      )
  );
  const { latitude, longitude } = req.query;

  if(!latitude || !longitude){
    return res.status(403).json(new ApiResponse(403, "Please provide the location coordinates"));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      location: {
        latitude, longitude
      }
    }
  }, {new: true});

  if(!updatedUser){
    return res.status(401).json(new ApiResponse(401, "User is not update for location coordinates"));
  }
  const getAllSaloon = await Partner.aggregate([
    {
      $geoNear: {
        near: {type: "Point", coordinates: [parseFloat(latitude), parseFloat(longitude)]},
        key: "location",
        maxDistance: parseFloat(100)*1609,
        distanceField: "dist.calculated",
        spherical: true
      }
    }
  ]);

  if(!getAllSaloon){
    return res.status(401).json(new ApiResponse(401, "Not finding any saloon near about you"));
  }

  return res.status(200).json(new ApiResponse(200, "Near By Saloons fetched successfully", getAllSaloon));
})