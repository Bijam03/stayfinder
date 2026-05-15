import { Link } from "react-router-dom";
import { FaStar, FaMapMarkerAlt, FaUser } from "react-icons/fa";

const PropertyCard = ({ property }) => {
  if (!property) return null;
  const { _id, title, images, price, location, rating, numReviews, maxGuests, propertyType } = property;

  return (
    <Link to={`/properties/${_id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">

        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-gray-200">
          {images && images.length > 0 ? (
            <img
              src={images[0].url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100">
              🏠
            </div>
          )}
          {/* Property type badge */}
          <span className="absolute top-3 left-3 bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full capitalize shadow-sm">
            {propertyType}
          </span>
        </div>

        {/* Details */}
        <div className="p-4">

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
            <FaMapMarkerAlt size={12} className="text-rose-400" />
            <span>{location?.city}, {location?.country}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-rose-500 transition-colors">
            {title}
          </h3>

          {/* Guests */}
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <FaUser size={11} />
            <span>Up to {maxGuests} guests</span>
          </div>

          {/* Price + Rating */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                ₹{price?.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm"> / night</span>
            </div>
            {numReviews > 0 && (
              <div className="flex items-center gap-1">
                <FaStar size={14} className="text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  {rating?.toFixed(1)}
                </span>
                <span className="text-gray-400 text-xs">({numReviews})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;