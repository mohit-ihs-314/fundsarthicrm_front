import { X, MapPin, Home, Bed, Bath, Maximize, Calendar, DollarSign, CheckCircle2, XCircle, Building2, Info } from "lucide-react";
import { Property } from "../data/mockData";
import StatusBadge from "./StatusBadge";

interface PropertyDetailDrawerProps {
    property: Property;
    onClose: () => void;
    onApprove?: (propertyId: string) => void;
    onReject?: (propertyId: string) => void;
}

export default function PropertyDetailDrawer({
    property,
    onClose,
    onApprove,
    onReject,
}: PropertyDetailDrawerProps) {

    const isPending = property.status === "pending";
    const isApproved = property.status === "approved";
    const isRejected = property.status === "rejected";

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Property Details
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{property.id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Property Image */}
                    <div className="relative h-80 rounded-2xl overflow-hidden">

                        {property.photos && property.photos.length > 0 ? (
                            <img
                                src={property.photos[0]}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full"
                                style={{ background: 'linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)' }}
                            />
                        )}

                        {/* Status */}
                        <div className="absolute top-4 right-4 z-10">
                            <StatusBadge status={property.status} />
                        </div>

                        {/* Fallback Overlay */}
                        {!property.photos?.length && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-center">
                                    <Home className="w-20 h-20 mx-auto mb-3 opacity-50" />
                                    <p className="text-lg opacity-75">Property Image</p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Property Info Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {property.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-5 h-5" />
                                <span className="text-lg">
                                    {property.location}, {property.city}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Property Type</p>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-gray-900">
                                        {property.type}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Listed Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-gray-900">
                                        {property.listedDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                        {property.description
                            ? property.description
                            : `This ${property.type?.toLowerCase()} is located in ${property.location}, ${property.city}.`}
                    </div>
                    {/* Price */}
                    <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)' }}>
                        <div className="flex items-center gap-2 text-white mb-2">
                            <DollarSign className="w-5 h-5" />
                            <p className="text-sm opacity-90">Property Price</p>
                        </div>
                        <p className="text-4xl font-bold text-white">
                            ₹{property.price}
                        </p>
                        <p className="text-sm text-white opacity-75 mt-1">
                            ₹{property.price.toLocaleString()}
                        </p>
                    </div>

                    {/* Features */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            Property Features
                        </h4>

                        <div className="grid grid-cols-3 gap-6">

                            {property.bedrooms && (
                                <div className="text-center">
                                    <Bed className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                    <p className="text-xl font-bold">{property.bedrooms}</p>
                                    <p className="text-sm text-gray-500">Bedrooms</p>
                                </div>
                            )}

                            {property.bathrooms && (
                                <div className="text-center">
                                    <Bath className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                                    <p className="text-xl font-bold">{property.bathrooms}</p>
                                    <p className="text-sm text-gray-500">Bathrooms</p>
                                </div>
                            )}

                            {property.area && (
                                <div className="text-center">
                                    <Maximize className="w-6 h-6 mx-auto mb-2 text-green-600" />
                                    <p className="text-xl font-bold">{property.area}</p>
                                    <p className="text-sm text-gray-500">Sq. Ft.</p>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Owner Info */}
                    {property.owner_name && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Owner Details</h4>

                            <p><strong>Name:</strong> {property.owner_name}</p>
                            <p><strong>Mobile:</strong> {property.owner_mobile}</p>
                            <p><strong>Email:</strong> {property.owner_email}</p>
                        </div>
                    )}

                    {/* Actions */}
                    {isPending && onApprove && onReject && (
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => { onApprove(property.id); onClose(); }}
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl"
                            >
                                Approve Property
                            </button>

                            <button
                                onClick={() => { onReject(property.id); onClose(); }}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl"
                            >
                                Reject Property
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}