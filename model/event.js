const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your event listing name!"],
    },
    description: {
        type: String,
        required: [true, "Please enter your event listing description!"],
    },
    category: {
        type: String,
        required: [true, "Please enter your event listing category!"],
    },
    start_Date: {
        type: Date,
        required: true,
    },
    finish_Date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        default: "Running",
    },
    tags: {
        type: String,
    },
    originalPrice: {
        type: Number,
    },
    discountPrice: {
        type: Number,
        required: [true, "Please enter your event listing price!"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter your event listing stock!"],
    },
    images: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],
    propertyId: {
        type: String,
        required: true,
    },
    property: {
        type: Object,
        required: true,
    },
    sold_out: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model("Event", eventSchema);
