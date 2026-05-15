import Property from "../models/Property.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

// ─── Helper: Upload all files from req.files ─────────────
const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, "stayfinder/properties"),
  );

  const results = await Promise.all(uploadPromises);

  return results.map((result) => ({
    url: result.secure_url,
    public_id: result.public_id,
  }));
};

// ─── @desc    Create a new property
// ─── @route   POST /api/properties
// ─── @access  Private (Host only)
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      amenities,
      propertyType,
      maxGuests,
      bedrooms,
      bathrooms,
    } = req.body;

    // Upload images to Cloudinary
    const images = await uploadImages(req.files);

    // Parse location if sent as JSON string from form data
    const parsedLocation =
      typeof location === "string" ? JSON.parse(location) : location;

    // Parse amenities if sent as JSON string
    const parsedAmenities =
      typeof amenities === "string" ? JSON.parse(amenities) : amenities || [];

    const property = await Property.create({
      title,
      description,
      price: Number(price),
      location: parsedLocation,
      amenities: parsedAmenities,
      propertyType: propertyType || "apartment",
      maxGuests: Number(maxGuests) || 1,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      images,
      host: req.user._id,
    });

    await property.populate("host", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Property listed successfully! 🏠",
      property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get all properties with search & filter
// ─── @route   GET /api/properties
// ─── @access  Public
export const getAllProperties = async (req, res) => {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      propertyType,
      maxGuests,
      amenities,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const filter = { isAvailable: true };

    if (city) {
      filter["location.city"] = { $regex: city, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (propertyType) filter.propertyType = propertyType;

    if (maxGuests) {
      filter.maxGuests = { $gte: Number(maxGuests) };
    }

    if (amenities) {
      filter.amenities = { $all: amenities.split(",") };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("host", "name avatar")
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get single property by ID
// ─── @route   GET /api/properties/:id
// ─── @access  Public
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "host",
      "name email avatar phone",
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get host's own listings
// ─── @route   GET /api/properties/my-listings
// ─── @access  Private (Host)
export const getMyListings = async (req, res) => {
  try {
    const properties = await Property.find({
      host: req.user._id,
    }).sort("-createdAt");

    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update a property
// ─── @route   PUT /api/properties/:id
// ─── @access  Private (Host — owner only)
export const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this property",
      });
    }

    // Parse existingImages sent from frontend
    // These are the images the host wants to KEEP
    let keptImages = property.images;
    if (req.body.existingImages) {
      keptImages =
        typeof req.body.existingImages === "string"
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;

      // Delete removed images from Cloudinary
      for (const img of property.images) {
        const stillExists = keptImages.find(
          (k) => k.public_id === img.public_id,
        );
        if (!stillExists) {
          await deleteFromCloudinary(img.public_id);
        }
      }
    }

    // Upload any new images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = await uploadImages(req.files);
    }

    // Merge kept + new images
    req.body.images = [...keptImages, ...newImages];

    // Parse location and amenities
    if (req.body.location && typeof req.body.location === "string") {
      req.body.location = JSON.parse(req.body.location);
    }
    if (req.body.amenities && typeof req.body.amenities === "string") {
      req.body.amenities = JSON.parse(req.body.amenities);
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("host", "name email avatar");

    res.status(200).json({
      success: true,
      message: "Property updated successfully ✅",
      property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Delete a property
// ─── @route   DELETE /api/properties/:id
// ─── @access  Private (Host — owner only)
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this property",
      });
    }

    // Delete all images from Cloudinary
    for (const image of property.images) {
      await deleteFromCloudinary(image.public_id);
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Property deleted successfully 🗑️",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Delete single image from property
// ─── @route   DELETE /api/properties/:id/image/:public_id
// ─── @access  Private (Host — owner only)
export const deletePropertyImage = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const public_id = req.params.public_id;

    // Delete from Cloudinary
    await deleteFromCloudinary(public_id);

    // Remove from DB
    property.images = property.images.filter(
      (img) => img.public_id !== public_id,
    );
    await property.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      images: property.images,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
