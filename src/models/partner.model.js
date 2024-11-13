import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    address: {
      shop_no: { type: String, required: true },
      city_name: { type: String, required: true },
      additional_name: { type: String },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    location: {
      type: {type: String, required: true},
      coordinates: []
    },
    email: { type: String, required: true },
    contact_number: { type: String, required: true },
    social_media_links: [{ type: String }],
    service_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adhaarCardOrPanCard: [{type: String}],
  },
  { timestamps: true }
);

partnerSchema.index({location: "2dsphere"});

export const Partner = mongoose.model("Partner", partnerSchema);